import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { QuizQuestion } from '@/lib/quiz';

interface DocUploadProps {
  onQuestionsProcessed: (questions: QuizQuestion[]) => void;
}

export function DocUpload({ onQuestionsProcessed }: DocUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<QuizQuestion[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
        toast.error('Please upload a .doc or .docx file');
        return;
      }
      setSelectedFile(file);
      setPreviewQuestions([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/process-doc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const data = await response.json();
      setPreviewQuestions(data.questions);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to process document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    onQuestionsProcessed(previewQuestions);
    setPreviewQuestions([]);
    setSelectedFile(null);
    toast.success('Questions added successfully');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <p className="text-sm text-gray-500">Upload a .doc or .docx file containing questions</p>
            </div>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="doc-upload"
            />
            <label htmlFor="doc-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <div>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </div>
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Questions'
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {previewQuestions.length > 0 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Questions</h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewQuestions([])}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Questions
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {previewQuestions.map((question, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">Question {index + 1}</p>
                    <p>{question.question}</p>
                    
                    <div className="ml-4 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center space-x-2 ${
                            option === question.correctAnswer ? 'text-green-600 font-medium' : ''
                          }`}
                        >
                          <span>{String.fromCharCode(65 + optIndex)}.</span>
                          <span>{option}</span>
                          {option === question.correctAnswer && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      ))}
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
          </div>
        </Card>
      )}
    </div>
  );
}
