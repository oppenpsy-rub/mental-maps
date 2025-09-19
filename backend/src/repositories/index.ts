import { ResearcherRepository } from './ResearcherRepository';
import { StudyRepository } from './StudyRepository';
import { QuestionRepository } from './QuestionRepository';
import { ResponseRepository } from './ResponseRepository';
import { ParticipantRepository } from './ParticipantRepository';
import { AudioRepository } from './AudioRepository';

export class RepositoryManager {
  private static instance: RepositoryManager;
  
  public readonly researchers: ResearcherRepository;
  public readonly studies: StudyRepository;
  public readonly questions: QuestionRepository;
  public readonly responses: ResponseRepository;
  public readonly participants: ParticipantRepository;
  public readonly audio: AudioRepository;

  private constructor() {
    this.researchers = new ResearcherRepository();
    this.studies = new StudyRepository();
    this.questions = new QuestionRepository();
    this.responses = new ResponseRepository();
    this.participants = new ParticipantRepository();
    this.audio = new AudioRepository();
  }

  public static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }
}

// Export singleton instance
export const repositories = RepositoryManager.getInstance();

// Export individual repositories
export {
  ResearcherRepository,
  StudyRepository,
  QuestionRepository,
  ResponseRepository,
  ParticipantRepository,
  AudioRepository
};