-- Seed data. Passwords: admin -> admin1234, performers -> muzik123

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('Administrator','avrumypolatsek@gmail.com','pbkdf2$100000$8ncmphKQRYCJbkyDDoE/Gg==$fizAq84KBAvaqwP8oCxAIsShKRcTea4d25rBvHgl/7k=','admin');

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('Michael Weiss','meir@example.com','pbkdf2$100000$Rz+Oj4/TQh5bibuQfkuzgg==$utYVjuR5ReXHOfULLZcSmTeSTI9sbJEplRt6FktoEUY=','performer');
INSERT OR IGNORE INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='meir@example.com'),'Michael Weiss','singer,chazan','A well-known singer and cantor for weddings and celebrations. Sings in a warm, heartfelt style.','718-555-0101','Brooklyn, NY','$800',1);
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-07','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-08','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-10','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-14','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-17','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-21','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-25','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-10-28','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-01','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-04','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-08','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'2026-11-14','available');

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('The Harmony Band','freilach@example.com','pbkdf2$100000$LsNIxspWwX6NXACXe4frLw==$zc2nReHJJgRzzdY9EHer0FdIo5gSH0bSewdn9cai6SY=','performer');
INSERT OR IGNORE INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='freilach@example.com'),'The Harmony Band','band,musician,keyboard','A full band with keyboard, violin, drums and horns. For every kind of event.','845-555-0147','Monsey, NY','$2,500',1);
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-06','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-09','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-11','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-12','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-16','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-19','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-23','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-27','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-10-30','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-11-03','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'2026-11-07','available');

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('Jake Black','yanky@example.com','pbkdf2$100000$/jIkHjNm0TiMdnTMqjtD1Q==$wF0LSHc7gDrmgyvDxg61v6+uLyD7EYdxDPRGQnIlmCs=','performer');
INSERT OR IGNORE INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='yanky@example.com'),'DJ Jake Black','dj,producer','DJ and producer for modern events, with full lighting and sound.','347-555-0199','Williamsburg, NY','$1,200',0);
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-08','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-13','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-15','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-20','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-24','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-10-29','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-02','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-05','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='yanky@example.com')),'2026-11-12','available');

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('Sam Green','shloime@example.com','pbkdf2$100000$i9KAJVGcetplCaSCviTxrA==$/KR6ns1VsIsXCy8H5qxaHSwnoKAul3QsbULpXOrdTls=','performer');
INSERT OR IGNORE INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='shloime@example.com'),'Sam Green','violin,musician','Violinist with over 15 years of experience. Solo or with a band.','718-555-0170','Flatbush, NY','$600',0);
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-07','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-10','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-18','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-22','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-26','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-10-31','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-11-09','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='shloime@example.com')),'2026-11-16','available');

INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES ('Barry Fried','berl@example.com','pbkdf2$100000$mabcDgGzEjyTgbxOdtXKkw==$YDgWFfKANhN7bC5sCV3xRw2EDiihsAm923WUAVuM03g=','performer');
INSERT OR IGNORE INTO performers (user_id,display_name,categories,bio,phone,location,price_from,featured) VALUES ((SELECT id FROM users WHERE email='berl@example.com'),'Barry Fried','badchen,mc','A lively entertainer and master of ceremonies. Brings energy to every celebration.','845-555-0122','Kiryas Joel, NY','$1,000',0);
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-06','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-11','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-14','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-19','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-10-25','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-01','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-07','available');
INSERT OR IGNORE INTO availability (performer_id,date,status) VALUES ((SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='berl@example.com')),'2026-11-15','available');

-- Showcase the newer profile fields on the demo artists (only fills blanks, so real edits are kept).
UPDATE performers SET genres='Chassidish, Classic, Heartfelt', languages='Yiddish, English, Hebrew', experience='18', price_to='$1,800', gallery='https://picsum.photos/seed/mw1/600/600
https://picsum.photos/seed/mw2/600/600
https://picsum.photos/seed/mw3/600/600'
  WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com') AND genres='';
UPDATE performers SET genres='Freilach, Dance, Classic', languages='Yiddish, English', experience='12', price_to='$5,000', gallery='https://picsum.photos/seed/hb1/600/600
https://picsum.photos/seed/hb2/600/600
https://picsum.photos/seed/hb3/600/600
https://picsum.photos/seed/hb4/600/600'
  WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com') AND genres='';

-- Mark the two spotlight demo artists as verified (showcase only).
UPDATE performers SET verified=1 WHERE user_id IN (SELECT id FROM users WHERE email IN ('meir@example.com','freilach@example.com')) AND verified=0;

-- A few approved sample reviews (guarded so re-running the seed never duplicates them).
INSERT INTO reviews (performer_id,author_name,rating,comment,approved)
  SELECT (SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'Chaim L.',5,'Michael sang at our wedding and it was unbelievable — everyone was talking about it for weeks.',1
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE author_name='Chaim L.' AND performer_id=(SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')));
INSERT INTO reviews (performer_id,author_name,rating,comment,approved)
  SELECT (SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')),'Sarah B.',5,'A beautiful voice and so easy to work with. Highly recommend.',1
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE author_name='Sarah B.' AND performer_id=(SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='meir@example.com')));
INSERT INTO reviews (performer_id,author_name,rating,comment,approved)
  SELECT (SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')),'Yossi G.',4,'Great band, kept the dancing going all night.',1
  WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE author_name='Yossi G.' AND performer_id=(SELECT id FROM performers WHERE user_id=(SELECT id FROM users WHERE email='freilach@example.com')));

