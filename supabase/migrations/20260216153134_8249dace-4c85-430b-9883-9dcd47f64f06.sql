UPDATE tasks 
SET 
  asset_id = '00aa7911-66c3-41e4-a896-4cb7b78bb72c', 
  provider_id = '4e6d297c-3176-4193-8ba9-a993077a989a', 
  notes = 'Request the refill on the 19th; last fill date was 1/22'
WHERE name = 'Nasal Spray Refill' 
  AND recurrence_rule = '30d' 
  AND status = 'pending' 
  AND id != 'ad69b017-738b-455b-b5bd-3abe61c741cc';