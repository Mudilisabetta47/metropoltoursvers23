
-- Conversations
CREATE TABLE public.copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Neue Unterhaltung',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_conversations TO authenticated;
GRANT ALL ON public.copilot_conversations TO service_role;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage own copilot conversations"
  ON public.copilot_conversations FOR ALL TO authenticated
  USING (auth.uid() = user_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
    OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
  ))
  WITH CHECK (auth.uid() = user_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'office')
    OR public.has_role(auth.uid(),'agent') OR public.has_role(auth.uid(),'driver')
  ));
CREATE INDEX idx_copilot_conv_user ON public.copilot_conversations(user_id, updated_at DESC);

-- Messages
CREATE TABLE public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_messages TO authenticated;
GRANT ALL ON public.copilot_messages TO service_role;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own copilot messages"
  ON public.copilot_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.copilot_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff insert own copilot messages"
  ON public.copilot_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.copilot_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff delete own copilot messages"
  ON public.copilot_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.copilot_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE INDEX idx_copilot_msg_conv ON public.copilot_messages(conversation_id, created_at);

-- Audit log (immutable, admin-read, service-role-write)
CREATE TABLE public.copilot_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  status TEXT NOT NULL CHECK (status IN ('success','error','denied')),
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.copilot_audit_log TO authenticated;
GRANT ALL ON public.copilot_audit_log TO service_role;
ALTER TABLE public.copilot_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read copilot audit"
  ON public.copilot_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
-- No INSERT/UPDATE/DELETE policies → only service_role can write; immutable for users.
CREATE INDEX idx_copilot_audit_created ON public.copilot_audit_log(created_at DESC);
CREATE INDEX idx_copilot_audit_user ON public.copilot_audit_log(user_id, created_at DESC);

-- updated_at trigger for conversations
CREATE TRIGGER trg_copilot_conv_updated
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
