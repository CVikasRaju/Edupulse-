-- ==========================================
-- EduPulse Supabase Seed Data (Mock Data)
-- ==========================================

-- 1. Profiles
INSERT INTO public."Profile" (id, role, full_name, email, department, year, section, usn, employee_id, designation, is_profile_complete, is_active, updated_at) VALUES
('admin-001', 'admin', 'Dr. Manjunath Kotari', 'admin@sahyadri.edu.in', 'Administration', NULL, NULL, NULL, 'SAH-ADM-001', 'Principal', true, true, NOW()),
('mentor-001', 'mentor', 'Dr. Priya Shetty', 'priya.shetty@sahyadri.edu.in', 'Computer Science', NULL, NULL, NULL, 'SAH-CS-042', 'Associate Professor', true, true, NOW()),
('student-001', 'mentee', 'Aditya Sharma', 'aditya.s@sahyadri.edu.in', 'Computer Science', 3, 'A', '4SH21CS001', NULL, NULL, true, true, NOW());

-- 2. Allocations
INSERT INTO public."Allocation" (id, mentor_id, mentee_id, is_active) VALUES
('alloc-001', 'mentor-001', 'student-001', true);

-- 3. Interactions
INSERT INTO public."Interaction" (id, mentor_id, mentee_id, date, duration_minutes, type, topics, remarks, follow_up_required, mode, is_acknowledged, is_follow_up_resolved, updated_at) VALUES
('int-001', 'mentor-001', 'student-001', '2024-10-15', 30, 'Academic', 'Mid-semester preparation', 'Student is well-prepared.', true, 'In-Person', true, true, NOW());

-- 4. Grades
INSERT INTO public."Grade" (id, student_id, semester, subject_name, subject_code, internal_marks, external_marks, total_marks, grade_letter, credits, sgpa, cgpa) VALUES
('g-001', 'student-001', 1, 'Engineering Mathematics I', '21MAT11', 38, 48, 86, 'S', 4, 8.5, 8.5);

-- 5. Achievements
INSERT INTO public."Achievement" (id, student_id, title, category, issuing_body, date, level, nba_points, status) VALUES
('ach-001', 'student-001', 'Smart India Hackathon 2024', 'Hackathon', 'Ministry of Education', '2024-03-15', 'National', 50, 'Verified');

-- Note: This is a minimal seed file adjusted to match Prisma table casing.
