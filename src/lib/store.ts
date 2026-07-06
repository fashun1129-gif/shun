export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export type QuizResult = {
  questionId: string;
  subject: string;
  correct: boolean;
  timestamp: number;
};
