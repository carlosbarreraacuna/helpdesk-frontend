import api from './api';

export interface KbCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  subcategories?: KbSubcategory[];
}

export interface KbSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  order_index: number;
  is_active: boolean;
}

export interface KbTag {
  id: number;
  name: string;
  slug: string;
}

export interface KbArticleVersion {
  id: number;
  article_id: number;
  version_number: number;
  title: string;
  content: string;
  change_summary?: string;
  editor_id: number;
  editor?: { id: number; name: string };
  is_published: boolean;
  created_at: string;
}

export interface KbArticle {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  subcategory_id?: number;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  current_version: number;
  published_at?: string;
  views_count: number;
  useful_count: number;
  not_useful_count: number;
  category?: KbCategory;
  subcategory?: KbSubcategory;
  author?: { id: number; name: string };
  tags?: KbTag[];
  published_version?: KbArticleVersion;
  versions?: KbArticleVersion[];
  user_vote?: 1 | -1 | null;
  created_at: string;
  updated_at: string;
}

export interface KbPaginated {
  data: KbArticle[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface KbSuggestion {
  id: number;
  title: string;
  slug: string;
  category?: string;
  views: number;
  useful: number;
}

// Categories
export const kbApi = {
  getCategories: () => api.get<KbCategory[]>('/kb/categories'),
  getAllCategories: () => api.get<KbCategory[]>('/kb/categories/all'),
  createCategory: (data: Partial<KbCategory>) => api.post<KbCategory>('/kb/categories', data),
  updateCategory: (id: number, data: Partial<KbCategory>) => api.patch<KbCategory>(`/kb/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/kb/categories/${id}`),

  getSubcategories: (categoryId: number) => api.get<KbSubcategory[]>(`/kb/categories/${categoryId}/subcategories`),
  createSubcategory: (categoryId: number, data: Partial<KbSubcategory>) =>
    api.post<KbSubcategory>(`/kb/categories/${categoryId}/subcategories`, data),
  updateSubcategory: (id: number, data: Partial<KbSubcategory>) => api.patch<KbSubcategory>(`/kb/subcategories/${id}`, data),
  deleteSubcategory: (id: number) => api.delete(`/kb/subcategories/${id}`),

  // Tags
  getTags: () => api.get<KbTag[]>('/kb/tags'),
  createTag: (name: string) => api.post<KbTag>('/kb/tags', { name }),
  deleteTag: (id: number) => api.delete(`/kb/tags/${id}`),

  // Articles
  getArticles: (params?: Record<string, unknown>) => api.get<KbPaginated>('/kb/articles', { params }),
  getArticle: (id: number) => api.get<KbArticle>(`/kb/articles/${id}`),
  createArticle: (data: {
    title: string;
    content: string;
    category_id: number;
    subcategory_id?: number;
    tag_ids?: number[];
    change_summary?: string;
  }) => api.post<KbArticle>('/kb/articles', data),
  createVersion: (
    articleId: number,
    data: { title?: string; content: string; change_summary?: string; tag_ids?: number[] }
  ) => api.post<KbArticleVersion>(`/kb/articles/${articleId}/versions`, data),
  getVersions: (articleId: number) => api.get<KbArticleVersion[]>(`/kb/articles/${articleId}/versions`),
  getVersion: (articleId: number, versionId: number) =>
    api.get<KbArticleVersion>(`/kb/articles/${articleId}/versions/${versionId}`),
  publishVersion: (articleId: number, versionId: number) =>
    api.post<KbArticle>(`/kb/articles/${articleId}/versions/${versionId}/publish`),
  updateStatus: (id: number, status: 'draft' | 'published' | 'archived') =>
    api.patch<KbArticle>(`/kb/articles/${id}/status`, { status }),
  deleteArticle: (id: number) => api.delete(`/kb/articles/${id}`),

  // Votes
  vote: (articleId: number, vote: 1 | -1) => api.post(`/kb/articles/${articleId}/vote`, { vote }),
  getUserVote: (articleId: number) => api.get<{ vote: 1 | -1 | null }>(`/kb/articles/${articleId}/vote`),

  // Suggestions (for ticket form)
  suggest: (q: string) => api.get<KbSuggestion[]>('/kb/suggest', { params: { q } }),

  // Ticket integration
  getTicketArticles: (ticketId: number) => api.get<KbArticle[]>(`/tickets/${ticketId}/kb-articles`),
  linkToTicket: (ticketId: number, articleId: number) =>
    api.post(`/tickets/${ticketId}/kb-articles`, { article_id: articleId }),
  unlinkFromTicket: (ticketId: number, articleId: number) =>
    api.delete(`/tickets/${ticketId}/kb-articles/${articleId}`),
};
