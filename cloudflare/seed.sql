-- Seed data. Passwords: admin -> admin1234, performers -> muzik123

INSERT INTO users (name,email,password_hash,role) VALUES ('Administrator','avrumypolatsek@gmail.com','pbkdf2$100000$8ncmphKQRYCJbkyDDoE/Gg==$fizAq84KBAvaqwP8oCxAIsShKRcTea4d25rBvHgl/7k=','admin');

INSERT INTO users (name,email,password_hash,role) VALUES ('Michael Weiss','meir@example.com','pbkdf2$100000$Rz+Oj4/TQh5bibuQfkuzgg==$utYVjuR5ReXHOfULLZcSmTeSTI9sbJEplRt6FktoEUY=','performer');
INSERT INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='meir@example.com'),'Michael Weiss','singer,chazan','A well-known singer and cantor for weddings and celebrations. Sings in a warm, heartfelt style.','718-555-0101','Brooklyn, NY','$800',1);
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-07','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-08','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-10','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-14','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-17','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-21','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-25','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-28','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-01','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-04','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-08','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-14','available');

INSERT INTO users (name,email,password_hash,role) VALUES ('The Harmony Band','freilach@example.com','pbkdf2$100000$LsNIxspWwX6NXACXe4frLw==$zc2nReHJJgRzzdY9EHer0FdIo5gSH0bSewdn9cai6SY=','performer');
INSERT INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='freilach@example.com'),'The Harmony Band','band,musician,keyboard','A full band with keyboard, violin, drums and horns. For every kind of event.','845-555-0147','Monsey, NY','$2,500',1);
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-06','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-09','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-11','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-12','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-16','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-19','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-23','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-27','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-30','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-11-03','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-11-07','available');

INSERT INTO users (name,email,password_hash,role) VALUES ('Jake Black','yanky@example.com','pbkdf2$100000$/jIkHjNm0TiMdnTMqjtD1Q==$wF0LSHc7gDrmgyvDxg61v6+uLyD7EYdxDPRGQnIlmCs=','performer');
INSERT INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='yanky@example.com'),'DJ Jake Black','dj,producer','DJ and producer for modern events, with full lighting and sound.','347-555-0199','Williamsburg, NY','$1,200',0);
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-08','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-13','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-15','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-20','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-24','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-29','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-02','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-05','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-12','available');

INSERT INTO users (name,email,password_hash,role) VALUES ('Sam Green','shloime@example.com','pbkdf2$100000$i9KAJVGcetplCaSCviTxrA==$/KR6ns1VsIsXCy8H5qxaHSwnoKAul3QsbULpXOrdTls=','performer');
INSERT INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='shloime@example.com'),'Sam Green','violin,musician','Violinist with over 15 years of experience. Solo or with a band.','718-555-0170','Flatbush, NY','$600',0);
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-07','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-10','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-18','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-22','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-26','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-31','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-11-09','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-11-16','available');

INSERT INTO users (name,email,password_hash,role) VALUES ('Barry Fried','berl@example.com','pbkdf2$100000$mabcDgGzEjyTgbxOdtXKkw==$YDgWFfKANhN7bC5sCV3xRw2EDiihsAm923WUAVuM03g=','performer');
INSERT INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='berl@example.com'),'Barry Fried','badchen,mc','A lively entertainer and master of ceremonies. Brings energy to every celebration.','845-555-0122','Kiryas Joel, NY','$1,000',0);
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-06','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-11','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-14','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-19','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-25','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-01','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-07','available');
INSERT INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-15','available');

