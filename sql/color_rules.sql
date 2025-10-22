-- สร้างตาราง color_rules สำหรับเก็บกฎการใส่สี
CREATE TABLE IF NOT EXISTS color_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team VARCHAR(100) NOT NULL COMMENT 'ชื่อทีม หรือ "ทั้งหมด" สำหรับ default',
  column_name VARCHAR(100) NOT NULL COMMENT 'ชื่อ column ที่ต้องการใส่สี',
  condition_type ENUM('greater', 'less', 'between') NOT NULL COMMENT 'ประเภทเงื่อนไข',
  unit_type ENUM('number', 'percent') NOT NULL COMMENT 'หน่วยที่ใช้เปรียบเทียบ',
  value1 DECIMAL(10, 2) NOT NULL COMMENT 'ค่าสำหรับเปรียบเทียบ (หรือค่าต่ำสุดถ้าเป็น between)',
  value2 DECIMAL(10, 2) NULL COMMENT 'ค่าสูงสุด (ใช้เฉพาะเงื่อนไข between)',
  color VARCHAR(7) NOT NULL DEFAULT '#ef4444' COMMENT 'สีในรูปแบบ hex เช่น #ef4444',
  is_bold BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'ใช้ตัวหนาหรือไม่',
  priority INT NOT NULL DEFAULT 0 COMMENT 'ลำดับความสำคัญ (เลขน้อย = สำคัญกว่า)',
  is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'เปิดใช้งานหรือไม่',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- สร้าง index เพื่อเพิ่มความเร็วในการค้นหา
  INDEX idx_team_column (team, column_name),
  INDEX idx_active (is_active),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บกฎการใส่สีตามเงื่อนไข';

-- ตัวอย่างข้อมูล
INSERT INTO color_rules (team, column_name, condition_type, unit_type, value1, value2, color, is_bold, priority) VALUES
('ทั้งหมด', 'CPM', 'greater', 'number', 100, NULL, '#ef4444', true, 1),
('ทั้งหมด', 'Silent', 'greater', 'percent', 50, NULL, '#f59e0b', false, 2),
('สาวอ้อย', 'CPM', 'between', 'number', 50, 100, '#10b981', false, 1);
