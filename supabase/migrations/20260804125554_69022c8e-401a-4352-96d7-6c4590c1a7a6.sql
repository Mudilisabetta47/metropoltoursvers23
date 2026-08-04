DELETE FROM public.advisor_chat_messages WHERE session_id = 'test_sess_qa1';
DELETE FROM public.advisor_chat_sessions WHERE session_id = 'test_sess_qa1';
DELETE FROM public.advisor_monthly_reports WHERE period_start = '2026-08-01';