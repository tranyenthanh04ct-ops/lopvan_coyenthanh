import React, { useState, useEffect } from 'react';
import { AuthUser, AdminStats, Student, Material, Assignment, Announcement } from '../../types';
import { apiAdmin } from '../../lib/api';
import { TeacherStats } from './TeacherStats';
import { TeacherStudents } from './TeacherStudents';
import { TeacherMaterials } from './TeacherMaterials';
import { TeacherAssignments } from './TeacherAssignments';
import { TeacherGrading } from './TeacherGrading';
import { TeacherAnnouncements } from './TeacherAnnouncements';
import {
  BarChart3,
  Users,
  FileText,
  PenTool,
  FileCheck2,
  Megaphone,
} from 'lucide-react';

interface TeacherDashboardProps {
  user: AuthUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  activeTab,
  setActiveTab,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGradingAsgId, setSelectedGradingAsgId] = useState<string>('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsData, studentsData, materialsData, asgData, annoData] = await Promise.all([
        apiAdmin.getStats().catch(() => null),
        apiAdmin.getStudents().catch(() => []),
        apiAdmin.getMaterials().catch(() => []),
        apiAdmin.getAssignments().catch(() => []),
        apiAdmin.getAnnouncements().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setStudents(studentsData);
      setMaterials(materialsData);
      setAssignments(asgData);
      setAnnouncements(annoData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleGradeAssignment = (assignmentId: string) => {
    setSelectedGradingAsgId(assignmentId);
    setActiveTab('grading');
  };

  const navTabs = [
    { id: 'stats', label: 'Tổng quan & Thống kê', icon: BarChart3 },
    { id: 'students', label: 'Quản lý học sinh', icon: Users, badge: students.length },
    { id: 'materials', label: 'Kho tài liệu', icon: FileText, badge: materials.length },
    { id: 'assignments', label: 'Giao bài tập', icon: PenTool, badge: assignments.length },
    {
      id: 'grading',
      label: 'Chấm bài làm',
      icon: FileCheck2,
      badge: stats?.pendingGradingCount ? stats.pendingGradingCount : undefined,
      badgeAlert: true,
    },
    { id: 'announcements', label: 'Thông báo', icon: Megaphone, badge: announcements.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-rose-100">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-rose-50 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.badgeAlert
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div>
        {activeTab === 'stats' && <TeacherStats stats={stats} onNavigateTab={setActiveTab} />}

        {activeTab === 'students' && (
          <TeacherStudents students={students} onRefresh={loadAllData} />
        )}

        {activeTab === 'materials' && (
          <TeacherMaterials
            materials={materials}
            students={students}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'assignments' && (
          <TeacherAssignments
            assignments={assignments}
            materials={materials}
            students={students}
            onRefresh={loadAllData}
            onGradeAssignment={handleGradeAssignment}
          />
        )}

        {activeTab === 'grading' && (
          <TeacherGrading
            assignments={assignments}
            selectedAssignmentId={selectedGradingAsgId}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'announcements' && (
          <TeacherAnnouncements
            announcements={announcements}
            onRefresh={loadAllData}
          />
        )}
      </div>
    </div>
  );
};
