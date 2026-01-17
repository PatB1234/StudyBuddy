import { Routes } from '@angular/router';
import { CustomPromptComponent } from './custom-prompt/custom-prompt.component';
import { FlashcardsComponent } from './flashcards/flashcards.component';
import { QuestionAnswerComponent } from './question-answer/question-answer.component';
import { SummariserComponent } from './summariser/summariser.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ViewStudentProfileComponent } from './view-student-profile/view-student-profile.component';
import { AddSectionComponent } from './add-section/add-section.component';
import { IntroPageComponent } from './intro-page/intro-page.component';
import { BasePageComponent } from './base-page/base-page.component';

export const routes: Routes = [
    {
        path: '',
        component: IntroPageComponent,
        pathMatch: 'full'
    },
    {
        path: '',
        component: BasePageComponent,
        children: [
            { path: 'home', component: DashboardComponent },
            { path: 'custom-prompt', component: CustomPromptComponent },
            { path: 'flashcards', component: FlashcardsComponent },
            { path: 'question-answer', component: QuestionAnswerComponent },
            { path: 'summariser', component: SummariserComponent },
            { path: 'student-profile', component: ViewStudentProfileComponent },
            { path: 'add-section', component: AddSectionComponent },
        ],
    },
    {
        path: 'login',
        component: LoginComponent
    },
];
