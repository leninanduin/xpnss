drop table cash_operation;
create table cash_operation (user_email varchar(50), ammount real, type varchar(100), auth_num varchar(50), date timestamp, bank varchar(50), is_procesed boolean );

drop table registered_user;
create table registered_user (uid serial PRIMARY KEY, user_email varchar(50), full_name varchar(50), gender varchar(10), fs_at varchar(75), fs_id varchar(50),status text, registered_date timestamp);

drop table event_checkin;
create table event_checkin (id varchar(50) PRIMARY KEY, user_id varchar(50), venue_id varchar(50), venue_name varchar(150), venue_icon varchar(250), venue_category json, event_category varchar(150), created_at timestamp, is_procesed boolean);

drop table event_browser;
create table event_browser (auth_num varchar(50), history_elements JSON, user_page_selected JSON);

CREATE OR REPLACE FUNCTION update_cash_operation() RETURNS TRIGGER AS
$BODY$
BEGIN
    UPDATE cash_operation SET is_procesed = true WHERE auth_num = new.auth_num;
    RETURN new;
END;
$BODY$
language plpgsql;

CREATE TRIGGER new_event_browser
    AFTER INSERT ON event_browser
    FOR EACH ROW
    EXECUTE PROCEDURE update_cash_operation();