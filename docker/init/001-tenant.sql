insert into "Tenant" ("id","name")
values ('default','default')
on conflict ("id") do nothing;
