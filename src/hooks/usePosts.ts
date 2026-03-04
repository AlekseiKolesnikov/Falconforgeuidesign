// src/hooks/usePosts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(first_name, last_name, avatar)')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const hashtags = content.match(/#\w+/g) || [];
      const { data, error } = await supabase
        .from('posts')
        .insert({ content, hashtags })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });
}
