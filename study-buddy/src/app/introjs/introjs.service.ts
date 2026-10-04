import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import introJs from 'intro.js';

interface TourStep {
    selector: string;
    title: string;
    intro: string;
    optional?: boolean; // Dropped if its element never shows up
}

const TARGET_TIMEOUT_MS = 4000;

@Injectable({
    providedIn: 'root'
})
export class IntrojsService {

    private platformId = inject(PLATFORM_ID);

    introJS: ReturnType<typeof introJs> | null = null;

    editUserFeature(): void {
        this.run('editUserExplanation', [
            {
                selector: '#changeName',
                title: 'Your name',
                intro: 'Write your new name here, if you wish to change it. This field is optional.'
            },
            {
                selector: '#enterCurrPwd',
                title: 'Current password',
                intro: 'Enter the current password to your account. This field is mandatory.'
            },
            {
                selector: '#enterNewPwd',
                title: 'New password',
                intro: 'Type your new password here. This field is optional.'
            },
            {
                selector: '#submitChanges',
                title: 'Save your changes',
                intro: 'Once you are done, click here to submit your changes. You cannot submit this form unless you fill in the current password. If you do not wish to change your account, simply return home by clicking the home button.'
            },
            {
                selector: '#deleteAccount',
                title: 'Deleting your account',
                intro: 'Deleting your account is permanent: it removes every note you have created alongside the account itself. You will be asked to type DELETE to confirm.'
            }
        ]);
    }

    buttonExplanationFeature(): void {
        // V2 so students who saw the old layout get a tour of the new one
        this.run('buttonExplanationCompletedV2', [
            {
                selector: '#noteSwitcher',
                title: 'What you are studying',
                intro: 'This shows the notes you are studying. Click it to switch to a different set at any time.'
            },
            {
                selector: '#add',
                title: 'Add notes',
                intro: 'Upload a PDF or a photo of your notes here.'
            },
            {
                // Only there once the tree has loaded and has subsections
                selector: '#expandIcon',
                title: 'Your notes',
                intro: 'Your notes are grouped into sections. Open a section and click a note to study it, or click the bin next to it to delete it.',
                optional: true
            },
            {
                selector: '#featureTabs',
                title: 'Ways to study',
                intro: 'Revise with flashcards, test yourself with practice questions, read a summary, or ask your notes anything.'
            },
            {
                selector: '#account',
                title: 'Your account',
                intro: 'Change your name or password, or log out, from here.'
            }
        ]);
    }

    addNotesFeature(): void {
        this.run('addNotesExplanation', [
            {
                selector: '#chooseFile',
                title: 'Pick your file',
                intro: 'Choose the file holding your notes. A PDF works best, but a photograph of a handwritten page is fine too.'
            },
            {
                selector: '#sectionName',
                title: 'Name this section',
                intro: 'Give these notes a name you will recognise later. This is the name that appears in the list on the left.'
            },
            {
                selector: '#handwrittenCheck',
                title: 'Handwritten notes',
                intro: 'Tick this box if your notes are handwritten. It tells us to read the handwriting rather than treat the file as typed text.'
            },
            {
                selector: '#uploadNotes',
                title: 'Upload',
                intro: 'Click here once you have chosen a file and named it. Processing can take a few minutes for a long set of notes, so leave the page open while it works.'
            }
        ]);
    }

    customPromptFeature(): void {
        this.run('customPromptExplanation', [
            {
                selector: '#promptField',
                title: 'Ask anything',
                intro: 'Type whatever you want to ask about the notes you are studying. Asking it to explain a topic, or to compare two ideas, both work well.'
            },
            {
                selector: '#promptSubmit',
                title: 'Send your question',
                intro: 'Click here to send your question. It is answered from the notes you are studying, so switch notes at the top if you meant a different set.'
            },
            {
                selector: '#promptResult',
                title: 'Your answer',
                intro: 'Your questions and answers build up here as a conversation. Anything mathematical is laid out properly, so formulae stay readable.'
            }
        ]);
    }

    flashcardsFeature(): void {
        this.run('flashcardsExplanation', [
            {
                selector: '#generateCards',
                title: 'A fresh deck',
                intro: 'Your cards load by themselves. Press this whenever you want a fresh deck made from the same notes.'
            },
            {
                selector: '#flashcard',
                title: 'The card itself',
                intro: 'Click the card to flip it over and check your answer. Try to recall the answer before you flip: that is what makes the revision stick.'
            },
            {
                selector: '#markCard',
                title: 'Did you know it?',
                intro: 'After flipping a card, tell us whether you knew it. "Review weak cards" then shows only the ones you are still learning.'
            },
            {
                selector: '#nextCard',
                title: 'Moving through the pack',
                intro: 'Step forwards and backwards through your cards with these buttons. The counter above shows where you are in the pack.'
            },
            {
                selector: '#exportQuizlet',
                title: 'Export to Quizlet',
                intro: 'Copies your cards ready to paste into Quizlet. We will tell you which import settings to choose once you click it.'
            },
            {
                selector: '#exportExcel',
                title: 'Export as a spreadsheet',
                intro: 'Downloads your cards as a CSV file, which opens in Excel or Google Sheets. Handy if you would rather revise away from the app or share them.'
            }
        ]);
    }

    questionAnswerFeature(): void {
        this.run('questionAnswerExplanation', [
            {
                selector: '#nextQuestion',
                title: 'Get a question',
                intro: 'A question is ready when you arrive. Press this whenever you want a new one.'
            },
            {
                selector: '#questionBox',
                title: 'The question',
                intro: 'Your question appears here. It is written from the notes you are studying.'
            },
            {
                selector: '#answerField',
                title: 'Your answer',
                intro: 'Type your answer here. Write as much as you can recall: a fuller answer gives you more useful feedback.'
            },
            {
                selector: '#submitAnswer',
                title: 'Check your answer',
                intro: 'Click here to have your answer marked against your notes.'
            },
            {
                selector: '#answerFeedback',
                title: 'Your feedback',
                intro: 'The marking appears here, including anything you missed. Reading what you left out is usually the most useful part.'
            }
        ]);
    }

    summariserFeature(): void {
        this.run('summariserExplanation', [
            {
                selector: '#summariseButton',
                title: 'Summarise your notes',
                intro: 'Click here to condense your selected notes into a summary. A long set of notes takes a little while.'
            },
            {
                selector: '#summaryOutput',
                title: 'Your summary',
                intro: 'The summary appears here, with any formulae laid out properly. It stays here while you use the other tabs.'
            },
            {
                selector: '#downloadSummary',
                title: 'Take it with you',
                intro: 'Saves your summary as a PDF, so you can revise from it or print it without coming back to the app.'
            }
        ]);
    }

    // Runs a tour once per user, once its targets are on the page.
    // intro.js floats a step whose element is null instead of erroring.
    private run(storageKey: string, steps: TourStep[]): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        if (this.readFlag(storageKey) === 'true') {
            return;
        }

        this.waitForTargets(steps).then(available => {
            // Wrong page. Don't show an empty overlay
            if (available.length === 0) {
                return;
            }
            // Might have been finished in another tab while we waited
            if (this.readFlag(storageKey) === 'true') {
                return;
            }
            // One tour at a time. This one stays unseen and opens next visit
            if (this.introJS) {
                return;
            }

            const tour = introJs();
            this.introJS = tour;

            tour.setOptions({
                steps: available.map(step => ({
                    element: step.selector,
                    title: step.title,
                    intro: step.intro
                })),
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: true,
                exitOnEsc: true,
                scrollToElement: true,
                scrollTo: 'tooltip',
                disableInteraction: true,
                helperElementPadding: 6,
                nextLabel: 'Next',
                prevLabel: 'Back',
                doneLabel: 'Got it'
            });

            const finish = () => {
                this.writeFlag(storageKey, 'true');
                document.body.classList.remove('introjs-active');
                this.introJS = null;
            };

            tour.oncomplete(finish);
            tour.onexit(finish);

            // Lets styles.css lift the sidenav above the intro.js overlay
            document.body.classList.add('introjs-active');
            tour.start();
        });
    }

    // Resolves once every target is on the page, or the timeout expires
    private waitForTargets(steps: TourStep[]): Promise<TourStep[]> {
        return new Promise(resolve => {
            const deadline = Date.now() + TARGET_TIMEOUT_MS;

            const check = () => {
                const present = steps.filter(step => document.querySelector(step.selector) !== null);
                const required = steps.filter(step => !step.optional);
                const allRequiredPresent = required.every(
                    step => document.querySelector(step.selector) !== null
                );

                if (allRequiredPresent) {
                    resolve(present);
                    return;
                }
                if (Date.now() >= deadline) {
                    resolve(present);
                    return;
                }
                requestAnimationFrame(check);
            };

            requestAnimationFrame(check);
        });
    }

    private readFlag(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null; // Private browsing or blocked storage
        }
    }

    private writeFlag(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Tour just shows again next time
        }
    }
}
