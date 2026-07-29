ALTER POLICY "Users can delete own seat holds" ON public.seat_holds TO authenticated;
ALTER POLICY "Users can view own seat holds" ON public.seat_holds TO authenticated;