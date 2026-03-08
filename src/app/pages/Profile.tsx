import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ProfileData {
  user_id: number;
  first_name: string;
  last_name: string;
  headline?: string;
  bio?: string;
  major?: string;
  graduation_year?: number;
  profile_photo_url?: string;
  university_id?: number;
  user_type: string;
  is_verified: boolean;
  role?: string;
  swimmer?: boolean;
  avatar?: string;
}

interface Education { school_name: string; degree?: string; field_of_study?: string; start_year?: number; end_year?: number; description?: string; }
interface Experience { organization_name: string; title: string; location?: string; start_date: string; end_date?: string | null; is_current: boolean; description?: string; }
interface Skill { name: string; proficiency_level?: string; }

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [university, setUniversity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');

      // 1. User data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, headline, bio, major, graduation_year, profile_photo_url, university_id, user_type, is_verified, email')
        .eq('auth_users_uuid', user.id)
        .single();

      if (userError || !userData) throw new Error('User data not found');

      // 2. Profile (using maybeSingle() to prevent crashes if this row doesn't exist)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, swimmer, avatar')
        .eq('email', userData.email)
        .maybeSingle();

      const fullProfile: ProfileData = {
        ...userData,
        user_id: userData.id, 
        role: profileData?.role || 'Student',
        swimmer: profileData?.swimmer || false,
        avatar: profileData?.avatar || ''
      };

      // 3. Education
      const { data: eduData } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', userData.id);

      // 4. Experiences
      const { data: expData } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userData.id)
        .order('end_date', { ascending: false, nullsFirst: true });

      // 5. Skills
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('proficiency_level, skills(name)')
        .eq('user_id', userData.id);

      // 6. University (Only fetch if the user actually has a university_id!)
      let uniName = '';
      if (userData.university_id) {
        const { data: uniData } = await supabase
          .from('universities')
          .select('name')
          .eq('id', userData.university_id)
          .single();

        uniName = uniData?.name || '';
      }

      setProfile(fullProfile);
      setEducation(eduData || []);
      setExperiences(expData || []);

      // Safely map skills assuming PostgREST returns the nested 'skills' object
      // @ts-ignore - TS sometimes struggles with Supabase nested relational types
      const mappedSkills = skillsData?.map((s: any) => ({
        name: s.skills?.name,
        proficiency_level: s.proficiency_level
      })) || [];

      setSkills(mappedSkills);
      setUniversity(uniName);

    } catch (error) {
      console.error('Profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">Loading profile...</div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-xl">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start space-x-6">
        <img
          src={profile.avatar || profile.profile_photo_url || '/default-avatar.png'}
          alt={`${profile.first_name} ${profile.last_name}`}
          className="w-24 h-24 rounded-full border-4 border-gray-200 object-cover"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-xl text-gray-600 mt-1">{profile.headline || 'No headline yet'}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            {profile.major && <span>{profile.major}</span>}
            {profile.major && profile.graduation_year && <span>•</span>}
            {profile.graduation_year && <span>Class of {profile.graduation_year}</span>}

            {profile.swimmer && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                🏊 Swimmer
              </span>
            )}
            {profile.is_verified && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* University */}
      {university && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900">📍 {university}</h3>
        </div>
      )}

      {/* About */}
      {profile.bio && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">About</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Education</h2>
          <div className="grid gap-6">
            {education.map((edu, i) => (
              <div key={i} className="group bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900">{edu.school_name}</h3>
                    <p className="text-gray-600 mt-1">
                      {edu.degree && `${edu.degree}, `}{edu.field_of_study} • {edu.start_year} - {edu.end_year}
                    </p>
                    {edu.description && (
                      <p className="mt-2 text-gray-700">{edu.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Experience</h2>
          <div className="space-y-6">
            {experiences.map((exp, i) => (
              <div key={i} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl shadow-sm border hover:shadow-md">
                <h3 className="font-bold text-xl text-gray-900 mb-1">{exp.organization_name}</h3>
                <p className="text-2xl text-gray-800 font-semibold">{exp.title}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {exp.location && `${exp.location} • `}{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                </p>
                {exp.description && (
                  <p className="mt-4 text-gray-700 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Skills & Endorsements</h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 rounded-full text-sm font-medium hover:from-indigo-200 transition-all cursor-default"
              >
                {skill.name}
                {skill.proficiency_level && (
                  <span className="ml-1 text-xs opacity-75">({skill.proficiency_level})</span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}