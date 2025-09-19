import { StudyService } from './src/services/StudyService.js';

async function testQuestionCreation() {
  try {
    console.log('=== Testing Question Creation ===');
    
    const studyService = new StudyService();
    
    // Use the existing study ID from database
    const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
    const researcherId = '35c80cc0-aae0-4e83-8d57-622b942ac6e5';
    
    console.log('Creating test question...');
    
    const questionData = {
      questionText: 'Test Frage - Wo befinden sich die wichtigsten Orte in Ihrer Stadt?',
      questionType: 'map_drawing',
      configuration: {
        allowedDrawingTools: ['pen', 'line', 'polygon']
      }
    };
    
    const question = await studyService.addQuestion(studyId, researcherId, questionData);
    
    console.log('✓ Question created successfully:');
    console.log('- ID:', question.id);
    console.log('- Text:', question.questionText);
    console.log('- Type:', question.questionType);
    console.log('- Order:', question.orderIndex);
    
    // Now get all questions for the study
    console.log('\n=== Getting all questions for study ===');
    const questions = await studyService.getStudyQuestions(studyId, researcherId);
    console.log('Total questions:', questions.length);
    questions.forEach((q, index) => {
      console.log(`${index + 1}. ${q.questionText} (${q.questionType})`);
    });
    
  } catch (error) {
    console.error('Error testing question creation:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testQuestionCreation();