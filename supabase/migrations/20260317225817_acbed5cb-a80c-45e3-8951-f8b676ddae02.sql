
DROP FUNCTION IF EXISTS public.lookup_account_by_phone(text);
DROP FUNCTION IF EXISTS public.lookup_account_by_email(text);

CREATE FUNCTION public.lookup_account_by_phone(phone_input text)
 RETURNS TABLE(auth_provider text, has_password boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ua.auth_provider, false AS has_password
  FROM public.user_accounts ua
  WHERE ua.phone_e164 = public.to_br_e164(phone_input)
  LIMIT 1;
$function$;

CREATE FUNCTION public.lookup_account_by_email(email_input text)
 RETURNS TABLE(auth_provider text, has_password boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ua.auth_provider, false AS has_password
  FROM public.user_accounts ua
  WHERE lower(ua.email) = lower(trim(email_input))
  LIMIT 1;
$function$;
