-- V5.1: platform service fee removed — enforce zero in DB
UPDATE bookings SET service_fee = 0 WHERE service_fee IS NULL OR service_fee <> 0;

ALTER TABLE bookings
ADD CONSTRAINT bookings_service_fee_zero CHECK (service_fee = 0);
