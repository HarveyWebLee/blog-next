import { SVGProps } from "react";

export type Locale = "zh-CN" | "en-US" | "ja-JP";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// 字典类型定义
export type Dictionary = {
  auth: {
    login: string;
    register: string;
    forgotPassword: string;
    resetPassword: string;
    email: string;
    password: string;
    confirmPassword: string;
    username: string;
    loginSuccess: string;
    registerSuccess: string;
    logoutSuccess: string;
    invalidCredentials: string;
    userExists: string;
    passwordMismatch: string;
    emailRequired: string;
    passwordRequired: string;
    usernameRequired: string;
  };
  blog: {
    title: string;
    subtitle: string;
    noPosts: string;
    loadMore: string;
    searchPlaceholder: string;
    filterByCategory: string;
    filterByTag: string;
    allCategories: string;
    allTags: string;
  };
  common: {
    home: string;
    about: string;
    blog: string;
    categories: string;
    tags: string;
    search: string;
    login: string;
    register: string;
    logout: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    create: string;
    back: string;
    next: string;
    previous: string;
    readMore: string;
    publishedAt: string;
    author: string;
    category: string;
    tag: string;
    views: string;
    likes: string;
    comments: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
    builtWith: string;
    poweredBy: string;
  };
  metadata: {
    title: string;
    description: string;
    applicationName: string;
    generator: string;
    authors: Array<{ name: string; url: string }>;
    keywords: string[];
    robots: string;
    openGraph: {
      title: string;
      description: string;
    };
    category: string;
  };
  navigation: {
    home: string;
    about: string;
    blog: string;
    categories: string;
    tags: string;
    manage: string;
    create: string;
    edit: string;
  };
  post: {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    publish: string;
    draft: string;
    published: string;
    unpublished: string;
    createPost: string;
    editPost: string;
    deletePost: string;
    confirmDelete: string;
    postCreated: string;
    postUpdated: string;
    postDeleted: string;
    titleRequired: string;
    contentRequired: string;
  };
  title: string;
};
