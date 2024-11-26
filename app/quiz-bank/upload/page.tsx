"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getSubjects, getCategories, type Subject, type Category } from '@/lib/db';
import { createQuiz, type QuizQuestion } from '@/lib/quiz';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QuizUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const fetchedSubjects = await getSubjects();
        setSubjects(fetchedSubjects);
      } catch (error) {
        toast.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, []);

  // Fetch categories when subject changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!subject) {
        setCategories([]);
        return;
      }

      try {
        const fetchedCategories = await getCategories(subject);
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, [subject]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setError(null);
    setQuestions([]);
    setProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-doc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const data = await response.json();
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response from server');
      }

      setQuestions(data.questions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file');
      setQuestions([]);
    } finally {
      setProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
    toast.success('Question deleted');
  };

  const handleUpload = async () => {
    if (!user?.uid) {
      toast.error('Please sign in to upload');
      return;
    }

    if (questions.length === 0) {
      toast.error('No questions to upload');
      return;
    }

    if (!subject || !category) {
      toast.error('Please select subject and category');
      return;
    }

    if (questions.length < 5) {
      toast.error('Quiz must contain at least 5 questions');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);

      const categoryObj = categories.find(c => c.id === category);
      const quizTitle = `${categoryObj?.name || category}-${new Date().toLocaleDateString()}`;
      
      const quizData = {
        title: quizTitle,
        subjectId: subject,
        categoryId: category,
        categoryName: categoryObj?.name || '',
        questions,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        isActive: true
      };

      const quizId = await createQuiz(quizData);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      toast.success('Quiz uploaded successfully!');
      
      // Reset form after a short delay
      setTimeout(() => {
        setFile(null);
        setQuestions([]);
        setSubject('');
        setCategory('');
        setUploadProgress(0);
      }, 1500);

    } catch (error) {
      console.error('Error uploading quiz:', error);
      toast.error('Failed to upload quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Upload Quiz</h2>
            <p className="text-sm text-gray-500">
              Upload a Word document (.doc or .docx) containing quiz questions. Our AI will process and format the questions automatically.
            </p>
          </div>

          <div {...getRootProps()} className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 space-y-4
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'}
          `}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              {isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium">Drag & drop your document here</p>
                  <p className="text-sm text-gray-500">or click to select a file</p>
                </>
              )}
            </div>
          </div>

          {file && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              {processing ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              ) : error ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={category} 
                onValueChange={setCategory}
                disabled={!subject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={subject ? "Select a category" : "Select a subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-500 text-center">
                {uploadProgress === 100 ? 'Upload complete!' : 'Uploading...'}
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!questions.length || !subject || !category || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Quiz'
            )}
          </Button>
        </div>
      </Card>

      {questions.length > 0 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Generated Questions</h3>
              <p className="text-sm text-gray-500">Total: {questions.length} questions</p>
            </div>
            
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={index} className="p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="space-y-2 pr-8">
                      <p className="font-medium">Question {index + 1}</p>
                      <p>{question.question}</p>
                      
                      <div className="ml-4 space-y-1">
                        {(question.options || []).map((option, optIndex) => {
                          if (!option) return null;
                          const optionLabel = String.fromCharCode(65 + optIndex); // Convert 0-4 to A-E
                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center space-x-2 ${
                                option === question.correctAnswer ? 'text-green-600 font-medium' : ''
                              }`}
                            >
                              <span>{optionLabel}.</span>
                              <span>{option}</span>
                              {option === question.correctAnswer && (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="font-medium">Explanation:</p>
                          <p>{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Document Guidelines</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Your document should contain quiz questions in any of these formats:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Q: [Question] followed by options labeled A, B, C, etc.</li>
              <li>Multiple choice questions with numbered options (1, 2, 3, etc.)</li>
              <li>Questions with options marked by bullets or dashes</li>
              <li>Questions with correct answers marked or stated</li>
              <li>Optional explanations for answers</li>
            </ul>
            <p className="mt-4">Our AI will process your document and format the questions appropriately. You can review and edit the processed questions before uploading.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
