-- Allow an authenticated user to create their own profile if the signup trigger missed.
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
