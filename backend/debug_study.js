import { StudyService } from './dist/services/StudyService.js';
import { StudyRepository } from './dist/repositories/StudyRepository.js';
import { QuestionRepository } from './dist/repositories/QuestionRepository.js';

async function debugStudy() {
    try {
        const studyService = new StudyService();
        const studyId = '80b5a530-8fc9-4864-8dcf-76b9638ed11c';
        
        console.log('Fetching study...');
        const studyRepo = new StudyRepository();
        const questionRepo = new QuestionRepository();
        
        const study = await studyRepo.findById(studyId);
        if (!study) {
            console.log('Study not found');
            return;
        }
        
        console.log('Study found:', {
            id: study.id,
            title: study.title,
            status: study.status,
            researcherId: study.researcherId
        });
        
        const questions = await questionRepo.findByStudy(studyId);
        console.log('Questions found:', questions.length);
        
        questions.forEach((q, index) => {
            console.log(`Question ${index + 1}:`, {
                id: q.id,
                text: q.questionText?.substring(0, 50) + '...',
                type: q.questionType,
                orderIndex: q.orderIndex,
                hasConfiguration: !!q.configuration
            });
        });
        
        console.log('Study settings:', {
            hasMapConfiguration: !!study.settings?.mapConfiguration,
            settings: study.settings
        });
        
        // Try to validate
        console.log('\nValidating study readiness...');
        const validationErrors = await studyService.validateStudyReadiness(study);
        if (validationErrors.length > 0) {
            console.log('Validation errors:', validationErrors);
        } else {
            console.log('Study is ready for activation');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugStudy();