"use client";

import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from 'lucide-react';
import { QuizQuestion } from "@/lib/quiz";

interface QuestionCardProps {
  question: QuizQuestion;
  selectedAnswer: string;
  showFeedback: boolean;
  onAnswerSelect: (answer: string) => void;
}

export function QuestionCard({
  question,
  selectedAnswer,
  showFeedback,
  onAnswerSelect,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-3">{question.question}</h3>
      
      <RadioGroup
        value={selectedAnswer}
        onValueChange={onAnswerSelect}
        className="space-y-2"
      >
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all duration-200 ${
              showFeedback
                ? option === question.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : option === selectedAnswer
                  ? 'border-red-500 bg-red-50'
                  : 'border-transparent'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label
              htmlFor={`option-${index}`}
              className="flex-grow cursor-pointer py-0.5"
            >
              {option}
            </Label>
            {showFeedback && option === question.correctAnswer && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            {showFeedback && option === selectedAnswer && !isCorrect && (
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </RadioGroup>

      {showFeedback && (
        <Alert className={`mt-3 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <AlertDescription>
            <div className="space-y-1.5">
              <p>
                {isCorrect 
                  ? 'Correct!' 
                  : `Incorrect. The correct answer is: ${question.correctAnswer}`}
              </p>
              {question.explanation && (
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Explanation: </span>
                  {question.explanation}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
