-- Fix 1: Restrict profiles table access to prevent data exposure
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Add delivery status transition validation
DROP TRIGGER IF EXISTS enforce_delivery_status_transitions ON public.deliveries;

CREATE OR REPLACE FUNCTION public.validate_delivery_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify driver assignment hasn't changed for active deliveries
  IF NEW.driver_id != OLD.driver_id AND OLD.status IN ('assigned', 'on_route') THEN
    RAISE EXCEPTION 'Cannot change status of reassigned delivery';
  END IF;
  
  -- Validate state transitions
  IF OLD.status = 'pending' AND NEW.status NOT IN ('assigned', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
  END IF;
  
  IF OLD.status = 'assigned' AND NEW.status NOT IN ('on_route', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from assigned to %', NEW.status;
  END IF;
  
  IF OLD.status = 'on_route' AND NEW.status NOT IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from on_route to %', NEW.status;
  END IF;
  
  -- Prevent changes to completed deliveries
  IF OLD.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot modify completed delivery status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_delivery_status_transitions
  BEFORE UPDATE OF status ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_delivery_status_update();

-- Fix 3: Prevent admin role self-assignment during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Only allow customer or driver role during signup
  IF NEW.raw_user_meta_data->>'role' IN ('customer', 'driver') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::public.app_role);
  ELSE
    -- Default to customer if invalid role provided
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer'::public.app_role);
  END IF;
  
  RETURN NEW;
END;
$$;