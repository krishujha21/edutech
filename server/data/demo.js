// ============================================================
// GramShiksha — In-Memory Demo Data Store
// All data lives in RAM; resets on server restart.
// ============================================================
const bcrypt = require('bcryptjs');

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ---------- SCHOOLS ----------
const schools = [
    { id: 1, name: 'SRM University, KTR', code: 'SRM-KTR-001', district: 'Kattankulathur', state: 'Tamil Nadu', block: 'Chengalpattu', pin_code: '603203', address: 'SRM Nagar, Kattankulathur', principal_name: 'Dr. R.K. Singh', contact_phone: '9876000001', contact_email: 'info@srmist.edu.in', student_count: 156, teacher_count: 12, is_active: true },
    { id: 2, name: 'Kendriya Vidyalaya, Patna', code: 'KV-PAT-001', district: 'Patna', state: 'Bihar', block: 'Patna City', pin_code: '800001', address: 'Bailey Road, Patna', principal_name: 'Mrs. S. Gupta', contact_phone: '9876000002', contact_email: 'kv.patna@edu.in', student_count: 320, teacher_count: 25, is_active: true },
    { id: 3, name: 'Govt. High School, Chapra', code: 'GHS-CHP-001', district: 'Saran', state: 'Bihar', block: 'Chapra Sadar', pin_code: '841301', address: 'Station Road, Chapra', principal_name: 'Mr. A. Mishra', contact_phone: '9876000003', contact_email: 'ghs.chapra@edu.in', student_count: 210, teacher_count: 15, is_active: true },
];

// ---------- USERS ----------
const users = [
    { id: 1, uuid: 'u-001', username: 'sharanya', password_hash: hash('12345'), role: 'student', full_name: 'Sharanya', email: 'sharanya@demo.com', phone: '9876543210', preferred_lang: 'en', school_id: 1, avatar_url: null, last_login: new Date(), last_sync: null },
    { id: 2, uuid: 'u-002', username: 'gayatri', password_hash: hash('12345'), role: 'student', full_name: 'Gayatri', email: 'gayatri@demo.com', phone: '9876543211', preferred_lang: 'en', school_id: 1, avatar_url: null, last_login: new Date(), last_sync: null },
    { id: 3, uuid: 'u-003', username: 'mahi', password_hash: hash('12345'), role: 'student', full_name: 'Mahi', email: 'mahi@demo.com', phone: '9876543212', preferred_lang: 'en', school_id: 1, avatar_url: null, last_login: new Date(), last_sync: null },
    { id: 4, uuid: 'u-004', username: 'oishani', password_hash: hash('12345'), role: 'student', full_name: 'Oishani', email: 'oishani@demo.com', phone: '9876543213', preferred_lang: 'en', school_id: 1, avatar_url: null, last_login: new Date(), last_sync: null },
    { id: 5, uuid: 'u-005', username: 'sonali', password_hash: hash('12345'), role: 'teacher', full_name: 'Sonali', email: 'sonali@demo.com', phone: '9876543214', preferred_lang: 'en', school_id: 1, avatar_url: null, last_login: new Date(), last_sync: null },
    { id: 6, uuid: 'u-006', username: 'krishu_admin', password_hash: hash('12345'), role: 'govt_admin', full_name: 'Krishu (Admin)', email: 'krishu.admin@demo.com', phone: '9876543215', preferred_lang: 'en', school_id: null, avatar_url: null, last_login: new Date(), last_sync: null },
];
let nextUserId = users.length + 1;

// ---------- STUDENTS ----------
const students = [
    { id: 1, user_id: 1, class_grade: 8, section: 'A', roll_number: '101', parent_name: '', gender: 'female', xp_points: 450, current_level: 5, streak_days: 7, is_at_risk: false, scholarship_eligible: false },
    { id: 2, user_id: 2, class_grade: 8, section: 'A', roll_number: '102', parent_name: '', gender: 'female', xp_points: 320, current_level: 4, streak_days: 3, is_at_risk: false, scholarship_eligible: true },
    { id: 3, user_id: 3, class_grade: 7, section: 'B', roll_number: '201', parent_name: '', gender: 'female', xp_points: 200, current_level: 3, streak_days: 5, is_at_risk: false, scholarship_eligible: false },
    { id: 4, user_id: 4, class_grade: 7, section: 'B', roll_number: '202', parent_name: '', gender: 'female', xp_points: 120, current_level: 2, streak_days: 1, is_at_risk: false, scholarship_eligible: false },
];
let nextStudentId = students.length + 1;

// ---------- TEACHERS ----------
const teachers = [
    { id: 1, user_id: 5 },
];
let nextTeacherId = teachers.length + 1;

// ---------- SUBJECTS ----------
const subjects = [
    { id: 1, name: 'Mathematics', code: 'MATH', icon: '📐', is_active: true },
    { id: 2, name: 'Science', code: 'SCI', icon: '🔬', is_active: true },
    { id: 3, name: 'English', code: 'ENG', icon: '📖', is_active: true },
    { id: 4, name: 'Hindi', code: 'HIN', icon: '📝', is_active: true },
    { id: 5, name: 'Social Studies', code: 'SST', icon: '🌍', is_active: true },
    { id: 6, name: 'Computer Basics', code: 'COMP', icon: '💻', is_active: true },
];

// ---------- LESSONS ----------
const lessons = [
    // Class 8 — Mathematics
    { id: 1, subject_id: 1, class_grade: 8, chapter_number: 1, lesson_number: 1, title: 'Rational Numbers', content_type: 'text', content: 'A rational number is a number that can be expressed as a fraction p/q where q ≠ 0. Examples: 1/2, -3/4, 7...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 2, subject_id: 1, class_grade: 8, chapter_number: 1, lesson_number: 2, title: 'Properties of Rational Numbers', content_type: 'text', content: 'Rational numbers follow closure, commutative, associative and distributive properties under addition and multiplication...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },
    { id: 3, subject_id: 1, class_grade: 8, chapter_number: 2, lesson_number: 1, title: 'Linear Equations in One Variable', content_type: 'text', content: 'A linear equation in one variable has the form ax + b = 0 where a ≠ 0. Learn to solve step by step...', language: 'en', xp_reward: 25, estimated_time_mins: 20, is_published: true, order_index: 3, updated_at: new Date() },
    { id: 4, subject_id: 1, class_grade: 8, chapter_number: 3, lesson_number: 1, title: 'Understanding Quadrilaterals', content_type: 'text', content: 'A quadrilateral is a polygon with four sides. Types include parallelogram, rectangle, square, rhombus, trapezium...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 4, updated_at: new Date() },

    // Class 8 — Science
    { id: 5, subject_id: 2, class_grade: 8, chapter_number: 1, lesson_number: 1, title: 'Crop Production and Management', content_type: 'text', content: 'Agriculture is the primary occupation in rural India. Crops are classified as Kharif (monsoon) and Rabi (winter)...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 6, subject_id: 2, class_grade: 8, chapter_number: 2, lesson_number: 1, title: 'Microorganisms: Friend and Foe', content_type: 'text', content: 'Microorganisms include bacteria, fungi, protozoa and algae. Some are useful (curd making, bread) while others cause diseases...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },
    { id: 7, subject_id: 2, class_grade: 8, chapter_number: 3, lesson_number: 1, title: 'Synthetic Fibres and Plastics', content_type: 'text', content: 'Synthetic fibres are made from petrochemicals. Examples: Rayon, Nylon, Polyester, Acrylic. Plastics — Thermoplastic vs Thermosetting...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 3, updated_at: new Date() },

    // Class 8 — English
    { id: 8, subject_id: 3, class_grade: 8, chapter_number: 1, lesson_number: 1, title: 'The Best Christmas Present', content_type: 'text', content: 'Read the story and understand the themes of family, love, and the spirit of giving...', language: 'en', xp_reward: 15, estimated_time_mins: 25, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 9, subject_id: 3, class_grade: 8, chapter_number: 1, lesson_number: 2, title: 'Grammar: Tenses', content_type: 'text', content: 'English has three main tenses: Past, Present, and Future. Each has four aspects: Simple, Continuous, Perfect, Perfect Continuous...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 8 — Hindi
    { id: 10, subject_id: 4, class_grade: 8, chapter_number: 1, lesson_number: 1, title: 'ध्वनि (Dhvani)', content_type: 'text', content: 'कवि सूर्यकान्त त्रिपाठी "निराला" की प्रसिद्ध कविता। प्रकृति का सुंदर वर्णन...', language: 'hi', xp_reward: 15, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 11, subject_id: 4, class_grade: 8, chapter_number: 2, lesson_number: 1, title: 'लाख की चूड़ियाँ', content_type: 'text', content: 'यह कहानी ग्रामीण भारत के शिल्पकारों की कला और उनके जीवन संघर्ष का वर्णन करती है...', language: 'hi', xp_reward: 15, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 8 — Social Studies
    { id: 12, subject_id: 5, class_grade: 8, chapter_number: 1, lesson_number: 1, title: 'How, When and Where', content_type: 'text', content: 'The study of history involves understanding dates, places and events. The British introduced surveys, censuses and record-keeping in India...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 13, subject_id: 5, class_grade: 8, chapter_number: 2, lesson_number: 1, title: 'From Trade to Territory', content_type: 'text', content: 'The East India Company came to India for trade but gradually established political control through the Battle of Plassey, Buxar...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 7 — Mathematics
    { id: 14, subject_id: 1, class_grade: 7, chapter_number: 1, lesson_number: 1, title: 'Integers', content_type: 'text', content: 'Integers include positive numbers, negative numbers, and zero. Learn operations on integers...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 15, subject_id: 1, class_grade: 7, chapter_number: 2, lesson_number: 1, title: 'Fractions and Decimals', content_type: 'text', content: 'Learn multiplication and division of fractions and decimals with real-life examples...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 7 — Science
    { id: 16, subject_id: 2, class_grade: 7, chapter_number: 1, lesson_number: 1, title: 'Nutrition in Plants', content_type: 'text', content: 'Plants make their own food through photosynthesis. Chlorophyll, sunlight, water and CO2 are needed...', language: 'en', xp_reward: 20, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 17, subject_id: 2, class_grade: 7, chapter_number: 2, lesson_number: 1, title: 'Nutrition in Animals', content_type: 'text', content: 'Animals depend on plants or other animals for food. Learn about the human digestive system...', language: 'en', xp_reward: 20, estimated_time_mins: 20, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 6 — Mathematics
    { id: 18, subject_id: 1, class_grade: 6, chapter_number: 1, lesson_number: 1, title: 'Knowing Our Numbers', content_type: 'text', content: 'Learn about large numbers, Indian and International place-value systems, estimation and rounding...', language: 'en', xp_reward: 15, estimated_time_mins: 15, is_published: true, order_index: 1, updated_at: new Date() },
    { id: 19, subject_id: 1, class_grade: 6, chapter_number: 2, lesson_number: 1, title: 'Whole Numbers', content_type: 'text', content: 'Whole numbers start from 0. Learn properties of whole numbers on the number line...', language: 'en', xp_reward: 15, estimated_time_mins: 15, is_published: true, order_index: 2, updated_at: new Date() },

    // Class 5 — Mathematics
    { id: 20, subject_id: 1, class_grade: 5, chapter_number: 1, lesson_number: 1, title: 'The Fish Tale (Shapes & Angles)', content_type: 'text', content: 'Explore different shapes, angles and symmetry through interesting stories and activities...', language: 'en', xp_reward: 10, estimated_time_mins: 10, is_published: true, order_index: 1, updated_at: new Date() },
];
let nextLessonId = lessons.length + 1;

// ---------- QUIZZES ----------
const quizzes = [
    {
        id: 1, subject_id: 1, class_grade: 8, lesson_id: 1, title: 'Rational Numbers Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 30,
        time_limit_mins: 10, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'Which of the following is a rational number?', type: 'mcq', options: ['√2', 'π', '3/7', '√5'], correct: 2, marks: 5, explanation: '3/7 can be expressed as p/q where q≠0' },
            { id: 'q2', text: 'What is the additive inverse of -5/3?', type: 'mcq', options: ['5/3', '-3/5', '3/5', '-5/3'], correct: 0, marks: 5, explanation: 'Additive inverse of a is -a, so inverse of -5/3 is 5/3' },
            { id: 'q3', text: '0 is a rational number.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: '0 can be written as 0/1' },
            { id: 'q4', text: 'Between two rational numbers there are:', type: 'mcq', options: ['No rational numbers', 'Exactly one', 'Finite many', 'Infinitely many'], correct: 3, marks: 5, explanation: 'Between any two rationals there are infinitely many rationals' },
        ])
    },
    {
        id: 2, subject_id: 1, class_grade: 8, lesson_id: 3, title: 'Linear Equations Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 30,
        time_limit_mins: 10, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'Solve: 2x + 5 = 13', type: 'mcq', options: ['x = 3', 'x = 4', 'x = 5', 'x = 9'], correct: 1, marks: 5, explanation: '2x = 13-5 = 8, so x = 4' },
            { id: 'q2', text: 'Solve: 3(x - 2) = 12', type: 'mcq', options: ['x = 4', 'x = 6', 'x = 2', 'x = 10'], correct: 1, marks: 5, explanation: '3x - 6 = 12, 3x = 18, x = 6' },
            { id: 'q3', text: 'If 5x - 3 = 3x + 7, then x = ?', type: 'mcq', options: ['2', '5', '10', '-5'], correct: 1, marks: 5, explanation: '5x - 3x = 7 + 3, 2x = 10, x = 5' },
            { id: 'q4', text: 'A linear equation has at most one solution.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: 'A linear equation in one variable has exactly one solution' },
        ])
    },
    {
        id: 3, subject_id: 2, class_grade: 8, lesson_id: 5, title: 'Crop Production Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 8, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'Paddy is a _____ crop.', type: 'mcq', options: ['Rabi', 'Kharif', 'Zaid', 'Cash'], correct: 1, marks: 5, explanation: 'Paddy is grown in the monsoon season (Kharif)' },
            { id: 'q2', text: 'Which of these is a Rabi crop?', type: 'mcq', options: ['Rice', 'Maize', 'Wheat', 'Cotton'], correct: 2, marks: 5, explanation: 'Wheat is sown in winter and harvested in spring (Rabi)' },
            { id: 'q3', text: 'Irrigation is the supply of water to crops.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: 'Irrigation means supplying water to crops at regular intervals' },
            { id: 'q4', text: 'The process of loosening and turning of soil is called:', type: 'mcq', options: ['Sowing', 'Tilling', 'Harvesting', 'Weeding'], correct: 1, marks: 5, explanation: 'Tilling/ploughing loosens and turns the soil for cultivation' },
        ])
    },
    {
        id: 4, subject_id: 2, class_grade: 8, lesson_id: 6, title: 'Microorganisms Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 8, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'Which microorganism is used to make curd from milk?', type: 'mcq', options: ['Yeast', 'Lactobacillus', 'Amoeba', 'Spirogyra'], correct: 1, marks: 5, explanation: 'Lactobacillus bacteria convert milk into curd' },
            { id: 'q2', text: 'Viruses can reproduce only inside:', type: 'mcq', options: ['Water', 'Soil', 'Host cells', 'Air'], correct: 2, marks: 5, explanation: 'Viruses need a living host cell to multiply' },
            { id: 'q3', text: 'Antibiotics work against viral infections.', type: 'true_false', options: ['True', 'False'], correct: 1, marks: 5, explanation: 'Antibiotics work against bacteria, not viruses' },
            { id: 'q4', text: 'Which disease is caused by a virus?', type: 'mcq', options: ['Cholera', 'Typhoid', 'Common Cold', 'Malaria'], correct: 2, marks: 5, explanation: 'Common cold is caused by rhinovirus' },
        ])
    },
    {
        id: 5, subject_id: 3, class_grade: 8, lesson_id: 9, title: 'English Tenses Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 10, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'She ___ to school every day.', type: 'mcq', options: ['go', 'goes', 'going', 'gone'], correct: 1, marks: 5, explanation: 'Simple present tense with third person singular uses "goes"' },
            { id: 'q2', text: 'They ___ playing cricket when it started to rain.', type: 'mcq', options: ['are', 'was', 'were', 'is'], correct: 2, marks: 5, explanation: 'Past continuous with plural subject uses "were"' },
            { id: 'q3', text: 'I have already ___ my homework.', type: 'mcq', options: ['do', 'did', 'done', 'doing'], correct: 2, marks: 5, explanation: 'Present perfect uses "have/has + past participle (done)"' },
            { id: 'q4', text: '"He will come tomorrow" is in future tense.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: '"Will come" indicates simple future tense' },
        ])
    },
    {
        id: 6, subject_id: 5, class_grade: 8, lesson_id: 12, title: 'History: British India Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 8, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'The Battle of Plassey was fought in:', type: 'mcq', options: ['1757', '1857', '1947', '1764'], correct: 0, marks: 5, explanation: 'The Battle of Plassey in 1757 was a turning point for British control' },
            { id: 'q2', text: 'Who introduced the Permanent Settlement in Bengal?', type: 'mcq', options: ['Warren Hastings', 'Lord Cornwallis', 'Robert Clive', 'Lord Dalhousie'], correct: 1, marks: 5, explanation: 'Lord Cornwallis introduced the Permanent Settlement in 1793' },
            { id: 'q3', text: 'The East India Company first came to India for:', type: 'mcq', options: ['Ruling', 'Education', 'Trade', 'Religion'], correct: 2, marks: 5, explanation: 'The Company initially came to trade in spices, cotton and silk' },
            { id: 'q4', text: 'James Mill divided Indian history into Hindu, Muslim and British periods.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: 'James Mill\'s "The History of British India" used this periodization' },
        ])
    },
    // Class 7 quizzes
    {
        id: 7, subject_id: 1, class_grade: 7, lesson_id: 14, title: 'Integers Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 10, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'What is (-3) + (-5)?', type: 'mcq', options: ['-8', '8', '-2', '2'], correct: 0, marks: 5, explanation: 'Adding two negative numbers: -3 + (-5) = -8' },
            { id: 'q2', text: 'What is (-7) × (-4)?', type: 'mcq', options: ['-28', '28', '-11', '11'], correct: 1, marks: 5, explanation: 'Negative × Negative = Positive: (-7)×(-4) = 28' },
            { id: 'q3', text: 'The successor of -1 is 0.', type: 'true_false', options: ['True', 'False'], correct: 0, marks: 5, explanation: 'The successor of any integer n is n+1, so successor of -1 is 0' },
            { id: 'q4', text: 'What is the absolute value of -15?', type: 'mcq', options: ['-15', '15', '0', '1'], correct: 1, marks: 5, explanation: 'Absolute value is the distance from 0, so |-15| = 15' },
        ])
    },
    {
        id: 8, subject_id: 2, class_grade: 7, lesson_id: 16, title: 'Nutrition in Plants Quiz',
        quiz_type: 'mcq', total_marks: 20, passing_score: 40, xp_reward: 25,
        time_limit_mins: 8, is_published: true, updated_at: new Date(),
        questions: JSON.stringify([
            { id: 'q1', text: 'Which gas is used by plants during photosynthesis?', type: 'mcq', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, marks: 5, explanation: 'Plants absorb CO2 and release O2 during photosynthesis' },
            { id: 'q2', text: 'The green pigment in leaves is called:', type: 'mcq', options: ['Melanin', 'Chlorophyll', 'Hemoglobin', 'Carotene'], correct: 1, marks: 5, explanation: 'Chlorophyll gives leaves their green color and helps in photosynthesis' },
            { id: 'q3', text: 'Mushrooms are autotrophs.', type: 'true_false', options: ['True', 'False'], correct: 1, marks: 5, explanation: 'Mushrooms are heterotrophs (saprophytes) that feed on dead organic matter' },
            { id: 'q4', text: 'Insectivorous plants trap insects because they:', type: 'mcq', options: ['Like eating', 'Need nitrogen', 'Need water', 'Grow faster'], correct: 1, marks: 5, explanation: 'These plants grow in nitrogen-poor soil and get nitrogen from insects' },
        ])
    },
];
let nextQuizId = quizzes.length + 1;

// ---------- BADGES ----------
const badges = [
    { id: 1, name: 'First Lesson', description: 'Complete your first lesson', icon: '🎯', criteria_type: 'lessons_completed', criteria_value: 1 },
    { id: 2, name: 'Quiz Master', description: 'Score 100% on any quiz', icon: '🏆', criteria_type: 'perfect_quiz', criteria_value: 1 },
    { id: 3, name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', criteria_type: 'streak_days', criteria_value: 7 },
    { id: 4, name: 'Knowledge Seeker', description: 'Complete 10 lessons', icon: '📚', criteria_type: 'lessons_completed', criteria_value: 10 },
    { id: 5, name: 'Rising Star', description: 'Reach Level 5', icon: '⭐', criteria_type: 'level', criteria_value: 5 },
    { id: 6, name: 'Science Explorer', description: 'Complete all Class 8 Science', icon: '🧪', criteria_type: 'subject_complete', criteria_value: 2 },
    { id: 7, name: 'Math Wizard', description: 'Score 90%+ on 5 Math quizzes', icon: '🧙', criteria_type: 'subject_quiz_score', criteria_value: 1 },
];

// ---------- STUDENT BADGES ----------
const student_badges = [
    { id: 1, student_id: 1, badge_id: 1, earned_at: new Date('2026-02-10') },
    { id: 2, student_id: 1, badge_id: 3, earned_at: new Date('2026-02-15') },
    { id: 3, student_id: 1, badge_id: 5, earned_at: new Date('2026-03-01') },
    { id: 4, student_id: 2, badge_id: 1, earned_at: new Date('2026-02-12') },
    { id: 5, student_id: 3, badge_id: 1, earned_at: new Date('2026-02-20') },
];

// ---------- PROGRESS TRACKING ----------
const progress = [
    { id: 1, uuid: 'p-001', student_id: 1, lesson_id: 1, status: 'completed', progress_pct: 100, time_spent_secs: 900, last_position: null, completed_at: new Date('2026-03-01'), is_synced: true, updated_at: new Date('2026-03-01') },
    { id: 2, uuid: 'p-002', student_id: 1, lesson_id: 2, status: 'completed', progress_pct: 100, time_spent_secs: 1200, last_position: null, completed_at: new Date('2026-03-02'), is_synced: true, updated_at: new Date('2026-03-02') },
    { id: 3, uuid: 'p-003', student_id: 1, lesson_id: 3, status: 'completed', progress_pct: 100, time_spent_secs: 800, last_position: null, completed_at: new Date('2026-03-03'), is_synced: true, updated_at: new Date('2026-03-03') },
    { id: 4, uuid: 'p-004', student_id: 1, lesson_id: 5, status: 'in_progress', progress_pct: 60, time_spent_secs: 500, last_position: '{"section":2}', completed_at: null, is_synced: true, updated_at: new Date('2026-03-05') },
    { id: 5, uuid: 'p-005', student_id: 2, lesson_id: 1, status: 'completed', progress_pct: 100, time_spent_secs: 700, last_position: null, completed_at: new Date('2026-03-02'), is_synced: true, updated_at: new Date('2026-03-02') },
    { id: 6, uuid: 'p-006', student_id: 2, lesson_id: 5, status: 'completed', progress_pct: 100, time_spent_secs: 600, last_position: null, completed_at: new Date('2026-03-04'), is_synced: true, updated_at: new Date('2026-03-04') },
    { id: 7, uuid: 'p-007', student_id: 3, lesson_id: 14, status: 'completed', progress_pct: 100, time_spent_secs: 800, last_position: null, completed_at: new Date('2026-03-03'), is_synced: true, updated_at: new Date('2026-03-03') },
    { id: 8, uuid: 'p-008', student_id: 3, lesson_id: 15, status: 'in_progress', progress_pct: 40, time_spent_secs: 300, last_position: '{"section":1}', completed_at: null, is_synced: true, updated_at: new Date('2026-03-06') },
    { id: 9, uuid: 'p-009', student_id: 4, lesson_id: 14, status: 'in_progress', progress_pct: 30, time_spent_secs: 200, last_position: '{"section":0}', completed_at: null, is_synced: true, updated_at: new Date('2026-03-05') },
];
let nextProgressId = progress.length + 1;

// ---------- QUIZ ATTEMPTS ----------
const quiz_attempts = [
    { id: 1, uuid: 'qa-001', quiz_id: 1, student_id: 1, answers: [2, 0, 0, 3], score: 20, total_marks: 20, percentage: 100, time_taken_secs: 240, started_at: new Date('2026-03-01'), completed_at: new Date('2026-03-01'), is_synced: true, created_at: new Date('2026-03-01') },
    { id: 2, uuid: 'qa-002', quiz_id: 2, student_id: 1, answers: [1, 1, 1, 0], score: 20, total_marks: 20, percentage: 100, time_taken_secs: 180, started_at: new Date('2026-03-03'), completed_at: new Date('2026-03-03'), is_synced: true, created_at: new Date('2026-03-03') },
    { id: 3, uuid: 'qa-003', quiz_id: 3, student_id: 2, answers: [1, 2, 0, 1], score: 20, total_marks: 20, percentage: 100, time_taken_secs: 200, started_at: new Date('2026-03-04'), completed_at: new Date('2026-03-04'), is_synced: true, created_at: new Date('2026-03-04') },
    { id: 4, uuid: 'qa-004', quiz_id: 7, student_id: 3, answers: [0, 1, 0, 1], score: 20, total_marks: 20, percentage: 100, time_taken_secs: 300, started_at: new Date('2026-03-03'), completed_at: new Date('2026-03-03'), is_synced: true, created_at: new Date('2026-03-03') },
];
let nextQuizAttemptId = quiz_attempts.length + 1;

// ---------- DAILY TARGETS ----------
const daily_targets = [
    { id: 1, student_id: 1, target_date: new Date().toISOString().split('T')[0], lessons_target: 2, lessons_done: 1, quizzes_target: 1, quizzes_done: 0, xp_earned: 20, is_completed: false },
    { id: 2, student_id: 2, target_date: new Date().toISOString().split('T')[0], lessons_target: 2, lessons_done: 0, quizzes_target: 1, quizzes_done: 0, xp_earned: 0, is_completed: false },
    { id: 3, student_id: 3, target_date: new Date().toISOString().split('T')[0], lessons_target: 2, lessons_done: 1, quizzes_target: 1, quizzes_done: 1, xp_earned: 45, is_completed: false },
    { id: 4, student_id: 4, target_date: new Date().toISOString().split('T')[0], lessons_target: 2, lessons_done: 0, quizzes_target: 1, quizzes_done: 0, xp_earned: 0, is_completed: false },
];

// ---------- ANNOUNCEMENTS ----------
const announcements = [
    { id: 1, uuid: 'ann-001', title: 'Welcome to GramShiksha!', content: 'Start learning today with fun lessons and quizzes. Complete daily targets to earn XP and climb the leaderboard!', author_id: 6, target_role: 'all', target_school: null, target_grade: null, priority: 'high', is_active: true, expires_at: null, created_at: new Date('2026-03-01') },
    { id: 2, uuid: 'ann-002', title: 'Science Fair Coming Up', content: 'Annual Science Fair is on March 25. Students of Class 6-8 can participate. Register with your teacher.', author_id: 5, target_role: 'student', target_school: 1, target_grade: null, priority: 'normal', is_active: true, expires_at: new Date('2026-03-25'), created_at: new Date('2026-03-05') },
    { id: 3, uuid: 'ann-003', title: 'New Math Lessons Added', content: 'We have added new lessons for Geometry and Algebra for Class 7 and 8. Check them out!', author_id: 6, target_role: 'all', target_school: null, target_grade: null, priority: 'normal', is_active: true, expires_at: null, created_at: new Date('2026-03-03') },
];
let nextAnnouncementId = announcements.length + 1;

// ---------- LEADERBOARD ----------
function getWeekKey() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

const leaderboard = [
    { id: 1, student_id: 1, school_id: 1, period_type: 'weekly', period_key: getWeekKey(), xp_points: 450, lessons_completed: 3, quizzes_passed: 2, avg_score: 100 },
    { id: 2, student_id: 2, school_id: 1, period_type: 'weekly', period_key: getWeekKey(), xp_points: 320, lessons_completed: 2, quizzes_passed: 1, avg_score: 100 },
    { id: 3, student_id: 3, school_id: 1, period_type: 'weekly', period_key: getWeekKey(), xp_points: 200, lessons_completed: 1, quizzes_passed: 1, avg_score: 100 },
    { id: 4, student_id: 4, school_id: 1, period_type: 'weekly', period_key: getWeekKey(), xp_points: 120, lessons_completed: 0, quizzes_passed: 0, avg_score: 0 },
];

// ---------- HOMEWORK ----------
const homework = [];
let nextHomeworkId = 1;

// ---------- SYNC LOGS ----------
const sync_logs = [];

// ============================================================
// Export everything
// ============================================================
module.exports = {
    users, nextUserId: () => nextUserId++,
    students, nextStudentId: () => nextStudentId++,
    teachers, nextTeacherId: () => nextTeacherId++,
    schools,
    subjects,
    lessons, nextLessonId: () => nextLessonId++,
    quizzes, nextQuizId: () => nextQuizId++,
    badges,
    student_badges,
    progress, nextProgressId: () => nextProgressId++,
    quiz_attempts, nextQuizAttemptId: () => nextQuizAttemptId++,
    daily_targets,
    announcements, nextAnnouncementId: () => nextAnnouncementId++,
    leaderboard,
    homework, nextHomeworkId: () => nextHomeworkId++,
    sync_logs,
    getWeekKey,
};
