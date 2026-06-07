/* =====================================================================
   DTMS  --  Seed data (mirrors the frontend mock data)
   Idempotent: only seeds when the tables are empty.
   ===================================================================== */

USE DTMS;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Distributors)
BEGIN
    INSERT INTO dbo.Distributors
        (Id, Code, Name, ContactPerson, Email, Phone, Address, City, JoinedAt, Status, AvatarColor)
    VALUES
        ('d-001','DST-N01','North Star Distribution Co.','Imran Sheikh','imran@northstar.example','+92 300 1110001','Plot 12, Industrial Area, North Nazimabad','Karachi','2023-04-12','active','#6366f1'),
        ('d-002','DST-S02','Southern Wave Distributors','Sara Ahmed','sara@southernwave.example','+92 321 2220002','Sea View Road, Clifton Block 5','Karachi','2022-09-30','active','#22c55e'),
        ('d-003','DST-C03','Central Hub Logistics','Bilal Qureshi','bilal@centralhub.example','+92 333 3330003','MA Jinnah Road, Saddar','Karachi','2024-01-15','active','#f59e0b'),
        ('d-004','DST-E04','Eastern Edge Trading','Aisha Khan','aisha@easternedge.example','+92 345 4440004','Gulshan-e-Iqbal Block 6','Karachi','2023-07-21','active','#ec4899'),
        ('d-005','DST-W05','Western Gateway Distributors','Hamza Iqbal','hamza@westgateway.example','+92 311 5550005','Orangi Town, Sector 12','Karachi','2022-11-04','active','#06b6d4'),
        ('d-006','DST-SE06','Coastline Supply Co.','Maryam Yousuf','maryam@coastline.example','+92 322 6660006','DHA Phase 8, Khayaban-e-Ittehad','Karachi','2024-03-09','active','#a855f7'),
        ('d-007','DST-NE07','Skyline Trade House','Usman Tariq','usman@skyline.example','+92 332 7770007','Federal B Area, Block 16','Karachi','2023-12-01','pending','#14b8a6'),
        ('d-008','DST-SW08','Harbour Line Distributors','Faryal Naeem','faryal@harbourline.example','+92 301 8880008','Korangi Industrial Area, Sector 23','Karachi','2021-06-18','inactive','#ef4444');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Territories)
BEGIN
    INSERT INTO dbo.Territories
        (Id, Name, CoverageArea, Notes, Color, DistributorId, CreatedAt, MonthlySales, TargetSales, Performance, Outlets, Population)
    VALUES
        ('t-001','North Zone','North Nazimabad, Nazimabad, North Karachi','Includes residential blocks and key markets in the north.','#6366f1','d-001','2024-04-15',184500,200000,'good',142,410000),
        ('t-002','South Coastal','Clifton, Defence Phase 1-5, Boat Basin','Premium retail corridor with high-end outlets.','#22c55e','d-002','2024-04-20',312000,300000,'excellent',198,520000),
        ('t-003','Central Business','Saddar, MA Jinnah Road, II Chundrigar','Dense commercial district with wholesale markets.','#f59e0b','d-003','2024-05-01',245800,260000,'good',167,380000),
        ('t-004','East Gardens','Gulshan-e-Iqbal, Gulistan-e-Jauhar','Family-oriented zone with strong FMCG demand.','#ec4899','d-004','2024-05-08',220300,240000,'good',184,465000),
        ('t-005','West Industrial','Orangi, SITE, Manghopir','Workforce dense — strong morning and evening traffic.','#06b6d4','d-005','2024-05-15',142500,180000,'average',121,290000),
        ('t-006','DHA Premium','DHA Phase 6-8, Khayaban-e-Ittehad','Upmarket residential — premium SKU performance.','#a855f7','d-006','2024-05-22',285900,280000,'excellent',156,340000),
        ('t-007','Northeast Hub','Federal B Area, Liaquatabad','Recently opened territory, ramping up.','#14b8a6',NULL,'2024-06-04',86400,150000,'underperforming',78,175000),
        ('t-008','Southwest Port','Korangi, Landhi Industrial','Industrial belt with B2B-heavy distribution.','#ef4444',NULL,'2024-06-11',118700,200000,'underperforming',94,210000);

    INSERT INTO dbo.TerritoryCoordinates (TerritoryId, PointOrder, Lat, Lng) VALUES
        ('t-001',0,24.9395,66.9856),('t-001',1,24.9568,67.0405),('t-001',2,24.9292,67.0561),('t-001',3,24.9027,67.0405),('t-001',4,24.9148,66.9893),
        ('t-002',0,24.8174,67.0245),('t-002',1,24.8338,67.0648),('t-002',2,24.8086,67.0856),('t-002',3,24.7912,67.0506),('t-002',4,24.8033,67.0179),
        ('t-003',0,24.8728,67.0167),('t-003',1,24.8845,67.0386),('t-003',2,24.8616,67.0521),('t-003',3,24.8447,67.0345),('t-003',4,24.8553,67.0103),
        ('t-004',0,24.9197,67.0833),('t-004',1,24.9377,67.1262),('t-004',2,24.9106,67.1481),('t-004',3,24.8896,67.1175),('t-004',4,24.9007,67.0921),
        ('t-005',0,24.9405,66.9333),('t-005',1,24.9586,66.9712),('t-005',2,24.9265,66.9931),('t-005',3,24.9087,66.9655),('t-005',4,24.9197,66.9388),
        ('t-006',0,24.7892,67.0712),('t-006',1,24.8067,67.1112),('t-006',2,24.7825,67.1356),('t-006',3,24.7625,67.1112),('t-006',4,24.7747,67.0712),
        ('t-007',0,24.9028,67.0628),('t-007',1,24.9197,67.0865),('t-007',2,24.8965,67.0985),('t-007',3,24.8825,67.0779),('t-007',4,24.8895,67.0617),
        ('t-008',0,24.825,67.1592),('t-008',1,24.8472,67.1934),('t-008',2,24.815,67.2192),('t-008',3,24.7903,67.1934),('t-008',4,24.8003,67.1647);
END
GO

PRINT 'DTMS seed complete.';
GO
