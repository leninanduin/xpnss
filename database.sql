drop table cash_operation;
create table cash_operation (user_email varchar(50), ammount real, type varchar(100), auth_num varchar(50), date timestamp, bank varchar(50), procesed_type varchar(20) DEFAULT 'NOT_PROCESED');

drop table registered_user;
create table registered_user (uid serial, user_email varchar(50) PRIMARY KEY, full_name varchar(50), gender varchar(10), fs_at varchar(75), fs_id varchar(50),status text DEFAULT 'ACTIVE', registered_date timestamp DEFAULT current_timestamp);

-- checkin
drop table event_checkin;
create table event_checkin (id varchar(50) PRIMARY KEY, user_id varchar(50), venue_id varchar(50), venue_name varchar(150), venue_icon varchar(250), venue_category json, event_category varchar(150), created_at timestamp, posible_auth_nums varchar(150), correct_auth_num varchar(50), is_procesed boolean DEFAULT false);

CREATE OR REPLACE FUNCTION update_cash_operation_checkin() RETURNS TRIGGER AS
$BODY$
BEGIN
    UPDATE cash_operation SET procesed_type = 'CHECKIN' WHERE strpos(new.posible_auth_nums, auth_num) > 0;
    RETURN new;
END;
$BODY$
language plpgsql;

drop TRIGGER new_event_checkin on event_checkin;
CREATE TRIGGER new_event_checkin
    AFTER UPDATE ON event_checkin
    FOR EACH ROW
    EXECUTE PROCEDURE update_cash_operation_checkin();

-- browser
drop table event_browser;
create table event_browser (auth_num varchar(50), history_elements JSON, user_page_selected JSON);

CREATE OR REPLACE FUNCTION update_cash_operation_browser() RETURNS TRIGGER AS
$BODY$
BEGIN
    UPDATE cash_operation SET procesed_type = 'BROWSER' WHERE auth_num = new.auth_num;
    RETURN new;
END;
$BODY$
language plpgsql;

drop TRIGGER new_event_browser on event_browser;
CREATE TRIGGER new_event_browser
    AFTER INSERT ON event_browser
    FOR EACH ROW
    EXECUTE PROCEDURE update_cash_operation_browser();