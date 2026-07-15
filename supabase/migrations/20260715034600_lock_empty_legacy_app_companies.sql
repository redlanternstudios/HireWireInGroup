-- The unused app.companies table is empty and had unrestricted authenticated access.

drop policy if exists "auth_all" on app.companies;
revoke all privileges on table app.companies from authenticated;
