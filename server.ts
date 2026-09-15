import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import {
  loadDb,
  saveDb,
  createSession,
  getSession,
  removeSession,
  UPLOADS_DIR,
} from './server/db';
import {
  Student,
  Material,
  Assignment,
  Submission,
  Announcement,
  AdminStats,
} from './src/types';

// Setup file upload storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Auth Middleware ---
  function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập lại!' });
    }
    const token = authHeader.split(' ')[1];
    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' });
    }
    (req as any).user = session;
    next();
  }

  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    authenticate(req, res, () => {
      const user = (req as any).user;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho Giáo viên (Admin)!' });
      }
      next();
    });
  }

  function requireStudent(req: Request, res: Response, next: NextFunction) {
    authenticate(req, res, () => {
      const user = (req as any).user;
      if (user.role !== 'student') {
        return res.status(403).json({ error: 'Khu vực chỉ dành cho Học sinh!' });
      }
      next();
    });
  }

  // --- API Routes ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'Học Giỏi Văn Cùng Cô Yến Thanh' });
  });

  // 1. File Upload endpoint
  app.post('/api/upload', authenticate, upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn tệp tin để tải lên' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  });

  // 2. Auth Routes
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { role, username, password } = req.body;
    const db = loadDb();

    if (role === 'admin') {
      if (!password) {
        return res.status(400).json({ error: 'Vui lòng nhập mật khẩu Quản trị' });
      }
      const isMatch = bcrypt.compareSync(password, db.adminPasswordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Mật khẩu Giáo viên không chính xác. Vui lòng thử lại!' });
      }
      const token = createSession('admin', 'admin');
      return res.json({
        success: true,
        token,
        user: {
          id: 'admin',
          role: 'admin',
          name: 'Cô Yến Thanh (Admin)',
        },
      });
    }

    if (role === 'student') {
      if (!username || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu' });
      }
      const trimmedUser = username.trim().toLowerCase();
      const student = db.students.find(s => s.username.toLowerCase() === trimmedUser);

      if (!student) {
        return res.status(401).json({ error: 'Tài khoản không tồn tại. Vui lòng liên hệ Cô Yến Thanh để được cấp tài khoản!' });
      }

      if (student.isLocked) {
        return res.status(403).json({ error: 'Tài khoản của em đang bị tạm khóa. Vui lòng liên hệ Cô Yến Thanh nhé!' });
      }

      const isMatch = student.passwordHash ? bcrypt.compareSync(password, student.passwordHash) : false;
      if (!isMatch) {
        return res.status(401).json({ error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' });
      }

      const token = createSession(student.id, 'student');
      return res.json({
        success: true,
        token,
        user: {
          id: student.id,
          role: 'student',
          name: student.fullName,
          username: student.username,
          classRoom: student.classRoom,
        },
      });
    }

    return res.status(400).json({ error: 'Vai trò đăng nhập không hợp lệ' });
  });

  app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
    const session = (req as any).user;
    const db = loadDb();

    if (session.role === 'admin') {
      return res.json({
        id: 'admin',
        role: 'admin',
        name: 'Cô Yến Thanh (Admin)',
      });
    }

    const student = db.students.find(s => s.id === session.userId);
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản học sinh' });
    }
    if (student.isLocked) {
      return res.status(403).json({ error: 'Tài khoản của em đang bị tạm khóa' });
    }

    return res.json({
      id: student.id,
      role: 'student',
      name: student.fullName,
      username: student.username,
      classRoom: student.classRoom,
    });
  });

  app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      removeSession(token);
    }
    res.json({ success: true });
  });

  // --- 3. Admin: Statistics ---
  app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
    const db = loadDb();
    const stats: AdminStats = {
      totalStudents: db.students.length,
      totalMaterials: db.materials.length,
      totalAssignments: db.assignments.length,
      totalSubmissions: db.submissions.length,
      pendingGradingCount: db.submissions.filter(s => s.status === 'submitted').length,
      completedGradingCount: db.submissions.filter(s => s.status === 'graded').length,
    };
    res.json(stats);
  });

  // --- 4. Admin: Students Management ---
  app.get('/api/admin/students', requireAdmin, (_req: Request, res: Response) => {
    const db = loadDb();
    // Return students without sensitive password hashes
    const sanitized = db.students.map(({ passwordHash, ...rest }) => rest);
    res.json(sanitized);
  });

  app.post('/api/admin/students', requireAdmin, (req: Request, res: Response) => {
    const { fullName, username, password, classRoom, parentPhone, notes } = req.body;
    if (!fullName || !username || !password || !classRoom) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ: Họ tên, Tên đăng nhập, Mật khẩu và Lớp học' });
    }

    const db = loadDb();
    const cleanUsername = username.trim().toLowerCase();
    if (db.students.some(s => s.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại. Vui lòng chọn tên đăng nhập khác!' });
    }

    const newStudent: Student = {
      id: 'std_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      fullName: fullName.trim(),
      username: cleanUsername,
      passwordHash: bcrypt.hashSync(password, 10),
      classRoom: classRoom.trim(),
      parentPhone: parentPhone ? parentPhone.trim() : '',
      notes: notes ? notes.trim() : '',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };

    db.students.push(newStudent);
    saveDb(db);

    const { passwordHash, ...sanitized } = newStudent;
    res.json({ success: true, student: sanitized });
  });

  app.put('/api/admin/students/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullName, username, classRoom, parentPhone, notes, isLocked, newPassword } = req.body;
    const db = loadDb();

    const studentIndex = db.students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh' });
    }

    const student = db.students[studentIndex];

    if (username && username.trim().toLowerCase() !== student.username.toLowerCase()) {
      const cleanUser = username.trim().toLowerCase();
      if (db.students.some(s => s.id !== id && s.username.toLowerCase() === cleanUser)) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng bởi học sinh khác' });
      }
      student.username = cleanUser;
    }

    if (fullName) student.fullName = fullName.trim();
    if (classRoom) student.classRoom = classRoom.trim();
    if (parentPhone !== undefined) student.parentPhone = parentPhone.trim();
    if (notes !== undefined) student.notes = notes.trim();
    if (typeof isLocked === 'boolean') student.isLocked = isLocked;

    if (newPassword && newPassword.trim()) {
      student.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
    }

    db.students[studentIndex] = student;
    saveDb(db);

    const { passwordHash, ...sanitized } = student;
    res.json({ success: true, student: sanitized });
  });

  app.delete('/api/admin/students/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();

    db.students = db.students.filter(s => s.id !== id);
    // clean submissions
    db.submissions = db.submissions.filter(s => s.studentId !== id);
    // remove from sessions
    db.sessions = db.sessions.filter(s => s.userId !== id);
    saveDb(db);

    res.json({ success: true, message: 'Đã xóa học sinh thành công' });
  });

  // --- 5. Admin: Materials Management ---
  app.get('/api/admin/materials', requireAdmin, (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.materials);
  });

  app.post('/api/admin/materials', requireAdmin, (req: Request, res: Response) => {
    const { title, description, topic, fileUrl, fileName, fileSize, fileType, assignedType, assignedStudentIds } = req.body;
    if (!title || !fileUrl) {
      return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và chọn tệp tài liệu' });
    }

    const db = loadDb();
    const newMaterial: Material = {
      id: 'mat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: description ? description.trim() : '',
      topic: topic ? topic.trim() : 'Chuyên đề chung',
      fileUrl,
      fileName: fileName || 'Tài liệu',
      fileSize: fileSize || 0,
      fileType: fileType || 'application/octet-stream',
      assignedType: assignedType === 'specific' ? 'specific' : 'all',
      assignedStudentIds: Array.isArray(assignedStudentIds) ? assignedStudentIds : [],
      createdAt: new Date().toISOString(),
    };

    db.materials.unshift(newMaterial);
    saveDb(db);

    res.json({ success: true, material: newMaterial });
  });

  app.put('/api/admin/materials/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, topic, fileUrl, fileName, fileSize, fileType, assignedType, assignedStudentIds } = req.body;
    const db = loadDb();

    const idx = db.materials.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu' });
    }

    const existing = db.materials[idx];
    const updated: Material = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      topic: topic !== undefined ? topic.trim() : existing.topic,
      fileUrl: fileUrl || existing.fileUrl,
      fileName: fileName || existing.fileName,
      fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
      fileType: fileType || existing.fileType,
      assignedType: assignedType !== undefined ? assignedType : existing.assignedType,
      assignedStudentIds: Array.isArray(assignedStudentIds) ? assignedStudentIds : existing.assignedStudentIds,
    };

    db.materials[idx] = updated;
    saveDb(db);
    res.json({ success: true, material: updated });
  });

  app.delete('/api/admin/materials/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();

    db.materials = db.materials.filter(m => m.id !== id);
    saveDb(db);
    res.json({ success: true, message: 'Đã xóa tài liệu' });
  });

  // --- 6. Admin: Assignments Management ---
  app.get('/api/admin/assignments', requireAdmin, (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.assignments);
  });

  app.post('/api/admin/assignments', requireAdmin, (req: Request, res: Response) => {
    const { title, instructions, questions, attachedMaterialIds, dueDate, targetType, targetStudentIds } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Vui lòng nhập tên bài tập' });
    }

    const db = loadDb();
    const newAssignment: Assignment = {
      id: 'asg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      instructions: instructions ? instructions.trim() : '',
      questions: Array.isArray(questions) ? questions : [],
      attachedMaterialIds: Array.isArray(attachedMaterialIds) ? attachedMaterialIds : [],
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetType: targetType === 'specific' ? 'specific' : 'all',
      targetStudentIds: Array.isArray(targetStudentIds) ? targetStudentIds : [],
      createdAt: new Date().toISOString(),
    };

    db.assignments.unshift(newAssignment);
    saveDb(db);
    res.json({ success: true, assignment: newAssignment });
  });

  app.put('/api/admin/assignments/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, instructions, questions, attachedMaterialIds, dueDate, targetType, targetStudentIds } = req.body;
    const db = loadDb();

    const idx = db.assignments.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    }

    const existing = db.assignments[idx];
    const updated: Assignment = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      instructions: instructions !== undefined ? instructions.trim() : existing.instructions,
      questions: Array.isArray(questions) ? questions : existing.questions,
      attachedMaterialIds: Array.isArray(attachedMaterialIds) ? attachedMaterialIds : existing.attachedMaterialIds,
      dueDate: dueDate || existing.dueDate,
      targetType: targetType !== undefined ? targetType : existing.targetType,
      targetStudentIds: Array.isArray(targetStudentIds) ? targetStudentIds : existing.targetStudentIds,
    };

    db.assignments[idx] = updated;
    saveDb(db);
    res.json({ success: true, assignment: updated });
  });

  app.delete('/api/admin/assignments/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();

    db.assignments = db.assignments.filter(a => a.id !== id);
    db.submissions = db.submissions.filter(s => s.assignmentId !== id);
    saveDb(db);
    res.json({ success: true, message: 'Đã xóa bài tập và các bài làm liên quan' });
  });

  // --- 7. Admin: Submissions & Grading ---
  app.get('/api/admin/assignments/:id/submissions', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();

    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    }

    // Determine target students
    const targetStudents = assignment.targetType === 'all'
      ? db.students
      : db.students.filter(s => assignment.targetStudentIds.includes(s.id));

    const submissions = db.submissions.filter(s => s.assignmentId === id);

    // Build comprehensive list for every assigned student
    const result = targetStudents.map(student => {
      const sub = submissions.find(s => s.studentId === student.id);
      return {
        studentId: student.id,
        studentName: student.fullName,
        studentClass: student.classRoom,
        submissionId: sub ? sub.id : null,
        status: sub ? sub.status : 'not_started',
        answers: sub ? sub.answers : {},
        submittedAt: sub ? sub.submittedAt : null,
        score: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
        gradedAt: sub ? sub.gradedAt : null,
      };
    });

    res.json({
      assignment,
      studentsSubmissions: result,
    });
  });

  app.post('/api/admin/submissions/:id/grade', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { score, feedback } = req.body;
    const db = loadDb();

    const idx = db.submissions.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bài nộp' });
    }

    const sub = db.submissions[idx];
    sub.score = typeof score === 'number' ? score : parseFloat(score);
    sub.feedback = feedback ? feedback.trim() : '';
    sub.status = 'graded';
    sub.gradedAt = new Date().toISOString();

    db.submissions[idx] = sub;
    saveDb(db);

    res.json({ success: true, submission: sub, message: 'Đã chấm điểm và trả bài cho học sinh thành công!' });
  });

  // --- 8. Announcements ---
  app.get('/api/announcements', authenticate, (_req: Request, res: Response) => {
    const db = loadDb();
    res.json(db.announcements);
  });

  app.post('/api/admin/announcements', requireAdmin, (req: Request, res: Response) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và nội dung thông báo' });
    }
    const db = loadDb();
    const newAnno: Announcement = {
      id: 'anno_' + Date.now().toString(36),
      title: title.trim(),
      content: content.trim(),
      targetType: 'all',
      createdAt: new Date().toISOString(),
    };
    db.announcements.unshift(newAnno);
    saveDb(db);
    res.json({ success: true, announcement: newAnno });
  });

  app.delete('/api/admin/announcements/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    db.announcements = db.announcements.filter(a => a.id !== id);
    saveDb(db);
    res.json({ success: true });
  });

  // --- 9. Student Endpoints ---
  app.get('/api/student/dashboard', requireStudent, (req: Request, res: Response) => {
    const studentId = (req as any).user.userId;
    const db = loadDb();
    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    // Assigned materials
    const materials = db.materials.filter(m =>
      m.assignedType === 'all' || m.assignedStudentIds.includes(studentId)
    );

    // Assigned assignments
    const assignments = db.assignments.filter(a =>
      a.targetType === 'all' || a.targetStudentIds.includes(studentId)
    );

    // Student's submissions
    const studentSubmissions = db.submissions.filter(s => s.studentId === studentId);

    // Combine assignments with submission status
    const assignmentOverview = assignments.map(a => {
      const sub = studentSubmissions.find(s => s.assignmentId === a.id);
      return {
        ...a,
        status: sub ? sub.status : 'not_started',
        score: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
        submittedAt: sub ? sub.submittedAt : null,
      };
    });

    const upcomingDue = assignmentOverview
      .filter(a => a.status === 'not_started' || a.status === 'draft')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const recentAssigned = assignmentOverview
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        username: student.username,
        classRoom: student.classRoom,
      },
      materialsCount: materials.length,
      assignmentsCount: assignments.length,
      completedCount: studentSubmissions.filter(s => s.status === 'graded').length,
      upcomingDue,
      recentAssigned,
      announcements: db.announcements.slice(0, 5),
    });
  });

  app.get('/api/student/materials', requireStudent, (req: Request, res: Response) => {
    const studentId = (req as any).user.userId;
    const db = loadDb();
    const materials = db.materials.filter(m =>
      m.assignedType === 'all' || m.assignedStudentIds.includes(studentId)
    );
    res.json(materials);
  });

  app.get('/api/student/assignments', requireStudent, (req: Request, res: Response) => {
    const studentId = (req as any).user.userId;
    const db = loadDb();

    const assignments = db.assignments.filter(a =>
      a.targetType === 'all' || a.targetStudentIds.includes(studentId)
    );

    const studentSubmissions = db.submissions.filter(s => s.studentId === studentId);

    const list = assignments.map(a => {
      const sub = studentSubmissions.find(s => s.assignmentId === a.id);
      return {
        ...a,
        submissionId: sub ? sub.id : null,
        status: sub ? sub.status : 'not_started',
        score: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
        submittedAt: sub ? sub.submittedAt : null,
        gradedAt: sub ? sub.gradedAt : null,
      };
    });

    res.json(list);
  });

  app.get('/api/student/assignments/:id', requireStudent, (req: Request, res: Response) => {
    const studentId = (req as any).user.userId;
    const { id } = req.params;
    const db = loadDb();

    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    }

    // Check if student is authorized
    if (assignment.targetType === 'specific' && !assignment.targetStudentIds.includes(studentId)) {
      return res.status(403).json({ error: 'Em không được giao bài tập này' });
    }

    const sub = db.submissions.find(s => s.assignmentId === id && s.studentId === studentId);

    // Attached materials
    const attachedMaterials = db.materials.filter(m => assignment.attachedMaterialIds?.includes(m.id));

    // Hide correct answers from student until graded!
    const sanitizedQuestions = assignment.questions.map(q => {
      if (sub && sub.status === 'graded') {
        return q; // student can see after graded
      }
      const { correctAnswerIndex, ...rest } = q;
      return rest;
    });

    res.json({
      assignment: {
        ...assignment,
        questions: sanitizedQuestions,
      },
      attachedMaterials,
      submission: sub || null,
    });
  });

  // Save draft or submit
  app.post('/api/student/assignments/:id/save', requireStudent, (req: Request, res: Response) => {
    const studentId = (req as any).user.userId;
    const { id } = req.params;
    const { answers, isOfficialSubmit } = req.body;
    const db = loadDb();

    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy bài tập' });
    }

    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    let subIndex = db.submissions.findIndex(s => s.assignmentId === id && s.studentId === studentId);
    let sub: Submission;

    if (subIndex === -1) {
      sub = {
        id: 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        assignmentId: id,
        studentId,
        studentName: student.fullName,
        studentClass: student.classRoom,
        status: isOfficialSubmit ? 'submitted' : 'draft',
        answers: answers || {},
        submittedAt: isOfficialSubmit ? new Date().toISOString() : undefined,
        lastSavedAt: new Date().toISOString(),
      };
      db.submissions.push(sub);
    } else {
      sub = db.submissions[subIndex];
      if (sub.status === 'graded') {
        return res.status(400).json({ error: 'Bài này đã được Cô chấm điểm, không thể sửa lại' });
      }
      sub.answers = answers || sub.answers;
      sub.lastSavedAt = new Date().toISOString();
      if (isOfficialSubmit) {
        sub.status = 'submitted';
        sub.submittedAt = new Date().toISOString();
      }
      db.submissions[subIndex] = sub;
    }

    saveDb(db);

    res.json({
      success: true,
      submission: sub,
      message: isOfficialSubmit ? 'Nộp bài thành công! Cô Yến Thanh sẽ chấm bài cho em sớm nhé 🌸' : 'Đã lưu bản nháp thành công!',
    });
  });

  // --- Vite middleware for development & production serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
