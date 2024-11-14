"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileType, File, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

const categories = [
  { id: 'web', name: 'Web Development' },
  { id: 'mobile', name: 'Mobile Development' },
  { id: 'cloud', name: 'Cloud Computing' },
  { id: 'ai', name: 'Artificial Intelligence' },
];

const difficulties = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

export default function QuizUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      
      if (fileType === 'application/pdf' || fileType === 'application/msword' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a PDF or DOC file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !category || !difficulty) {
      toast.error('Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      // Here you would implement the file upload logic
      // For example, using Firebase Storage
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated upload
      
      setProcessing(true);
      // Here you would implement the quiz extraction logic
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulated processing
      
      toast.success('Quiz uploaded and processed successfully!');
      setFile(null);
      setCategory('');
      setDifficulty('');
    } catch (error) {
      toast.error('Failed to upload quiz');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Upload Quiz</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Upload File</h2>
            <p className="text-sm text-gray-500 text-center">Upload your quiz document</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <FileType className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Supported Formats</h2>
            <p className="text-sm text-gray-500 text-center">PDF, DOC, DOCX</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <File className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Processing</h2>
            <p className="text-sm text-gray-500 text-center">Automatic question extraction</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff.id} value={diff.id}>
                    {diff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload File</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading || processing}
            />
            <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
          </div>

          {(uploading || processing) && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{processing ? 'Processing quiz...' : 'Uploading file...'}</span>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!file || !category || !difficulty || uploading || processing}
          >
            {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Quiz'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Guidelines</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Upload documents in PDF, DOC, or DOCX format</li>
            <li>Each question should be clearly marked in the document</li>
            <li>Include multiple choice options for each question</li>
            <li>Mark the correct answer for each question</li>
            <li>Maximum file size is 10MB</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}