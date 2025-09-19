#!/usr/bin/env node
import 'reflect-metadata';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './connection';
import { Researcher } from '../models/Researcher';
import { Study } from '../models/Study';
import { Question } from '../models/Question';

// Load environment variables
dotenv.config();

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const researcherRepository = AppDataSource.getRepository(Researcher);
        const studyRepository = AppDataSource.getRepository(Study);
        const questionRepository = AppDataSource.getRepository(Question);

        // Create test researcher
        const existingResearcher = await researcherRepository.findOne({
            where: { email: 'test@example.com' }
        });

        let researcher: Researcher;
        if (!existingResearcher) {
            researcher = new Researcher();
            researcher.email = 'test@example.com';
            researcher.passwordHash = await bcrypt.hash('password123', 10);
            researcher.name = 'Test Researcher';
            researcher.institution = 'Test University';

            researcher = await researcherRepository.save(researcher);
            console.log('✅ Test researcher created');
        } else {
            researcher = existingResearcher;
            console.log('ℹ️  Test researcher already exists');
        }

        // Create test study
        const existingStudy = await studyRepository.findOne({
            where: { title: 'Test Mental Maps Study' }
        });

        let study: Study;
        if (!existingStudy) {
            study = new Study();
            study.researcherId = researcher.id;
            study.title = 'Test Mental Maps Study';
            study.description = 'A test study for mental maps research';
            study.settings = {
                mapConfiguration: {
                    initialBounds: {
                        north: 54.0,
                        south: 47.0,
                        east: 15.0,
                        west: 5.0
                    },
                    allowedZoomLevels: [5, 15],
                    mapStyle: 'standard',
                    enabledTools: ['pen', 'polygon', 'text']
                },
                participantSettings: {
                    allowAnonymous: true,
                    requireDemographics: false
                }
            };
            study.active = false;

            study = await studyRepository.save(study);
            console.log('✅ Test study created');

            // Create test questions
            const questions = [
                {
                    questionText: 'Wo sprechen die Menschen Ihrer Meinung nach Hochdeutsch?',
                    questionType: 'map_drawing' as const,
                    configuration: {
                        drawingTools: ['polygon'],
                        colors: ['#ff0000', '#00ff00', '#0000ff']
                    },
                    orderIndex: 1
                },
                {
                    questionText: 'Markieren Sie Gebiete mit starken Dialekten.',
                    questionType: 'heatmap' as const,
                    configuration: {
                        heatmapSettings: {
                            radius: 50,
                            maxIntensity: 100
                        }
                    },
                    orderIndex: 2
                }
            ];

            for (const questionData of questions) {
                const question = new Question();
                question.studyId = study.id;
                question.questionText = questionData.questionText;
                question.questionType = questionData.questionType;
                question.configuration = questionData.configuration;
                question.orderIndex = questionData.orderIndex;

                await questionRepository.save(question);
            }

            console.log('✅ Test questions created');
        } else {
            console.log('ℹ️  Test study already exists');
        }

        console.log('🎉 Database seeding completed successfully');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedDatabase();
}