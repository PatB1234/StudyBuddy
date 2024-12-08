import { Routes } from '@angular/router';
import { CustomPromptComponent } from './custom-prompt/custom-prompt.component';
import { FlashcardsComponent } from './flashcards/flashcards.component';
import { QuestionAnswerComponent } from './question-answer/question-answer.component';
import { SummariserComponent } from './summariser/summariser.component';

export const routes: Routes = [

    {
        path: 'custom-prompt', 
        component: CustomPromptComponent
    },
    {
        path: 'flashcards',
        component: FlashcardsComponent
    },
    {
        path: 'question-answer',
        component: QuestionAnswerComponent
    }, 
    {
        path: 'summariser',
        component: SummariserComponent
    }
];
