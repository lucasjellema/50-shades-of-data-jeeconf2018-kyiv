--preparation:

create table products
( id            number(5) not null primary key
, name          varchar2(200)
, price         number(10,2)
, weight        number(10,0)
, creation_time timestamp default systimestamp
);


select * from products;

insert into products
( id , name, price, weight)
values
(1, 'Stroopwafel', 2.50, 375);

commit;

update products set price = 2.75 where id =1;

commit;

update products set weight= 425 where id =1;

commit;



-- start second session

exec DBMS_FLASHBACK.ENABLE_AT_TIME( query_time => systimestamp - interval '10' minute)

select * from products;

-- change products in session 1:


update products set name = 'Syrup Waffles (Stroopwafels)', weight= 450, price = 3.10 where id =1;


-- in session 2:
select * from products;

-- no change, no commit

-- in session 1:

commit;

select * from products;

-- in session 2:
select * from products;

-- still no fresh data

exec DBMS_FLASHBACK.disable

select * from products;

-- now we see it.
-- we were looking at the history:
exec DBMS_FLASHBACK.ENABLE_AT_TIME( query_time => systimestamp - interval '10' minute)
select * from products;
exec DBMS_FLASHBACK.disable

select * from products;

-- alternative historic query:

select * from products as of timestamp systimestamp - interval '10' minute;

-- to get all versions i.e. PRODUCT EVENTS:

SELECT versions_startscn, versions_starttime, 
       versions_endscn, versions_endtime,
       versions_xid, versions_operation,
       name, price, weight  
FROM   products 
       VERSIONS BETWEEN TIMESTAMP MINVALUE and MAXVALUE;


create view product_events
as
select nvl(versions_starttime, creation_time) as timestamp
,      case versions_operation when 'I' then 'CREATE PRODUCT' when 'U' then 'MODIFY PRODUCT' when 'D' then 'MODIFY PRODUCT' else 'CREATE PRODUCT' end event_type
,      id 
,      name
,      price
,      weight
from   products
       VERSIONS BETWEEN TIMESTAMP MINVALUE and MAXVALUE;




create or replace
procedure publish_product_events as

  -- REPLACE URL WITH SOME NGROK ENDPOINT and make sure product event producer is running locally!!
  l_url varchar2(200) := 'JEEConf2018ProductMS-a516817.apaas.us2.oraclecloud.com/product-event';
  l_query varchar2(1000) :='?';
  l_response varchar2(32000);
  
begin
  for event in (select * from product_events) loop
    l_query:= l_query || 'id='||event.id; 
    l_query:= l_query || 'name='||event.name; 
    l_query:= l_query || 'price='||event.price; 
    l_query:= l_query || 'weight='||event.weight; 
    l_query:= l_query || 'event_type='||event.event_type; 
    l_response := utl_http.request(l_url || utl_url.escape(l_query));
  end loop;
end publish_product_events;
/


exec  publish_product_events 


execute as SYS:

grant execute on utl_http to c##devoxx
/


BEGIN
  DBMS_NETWORK_ACL_ADMIN.create_acl (
    acl          => 'products_eventsourcing_acl_file.xml', 
    description  => 'Granting c##devoxx access to connect to external hosts',
    principal    => 'C##DEVOXX',
    is_grant     => TRUE, 
    privilege    => 'connect',
    start_date   => SYSTIMESTAMP,
    end_date     => NULL);
end;
 
begin
  DBMS_NETWORK_ACL_ADMIN.assign_acl (
    acl         => 'products_eventsourcing_acl_file.xml',
    host        => 'JEEConf2018ProductMS-a516817.apaas.us2.oraclecloud.com', 
    lower_port  => null,
    upper_port  => NULL);    
end; 
