import { Injectable } from '@angular/core';
import introJs from 'intro.js';

@Injectable({
    providedIn: 'root'
})
export class IntrojsService {

    constructor() { }

    introJS: ReturnType<typeof introJs> | null = null;
    addNotesFeature() { } // 3
    flashcardsFeature() { } // 4
    questionAnswerFeature() { } // 5
    editUserFeature() { } // 2
    buttonExplanationFeature() {

        this.introJS = introJs();
        this.introJS.start();
        if (localStorage.getItem('buttonExplanationCompleted') != "true") {
            this.introJS.setOptions({
                steps:
                    [
                        {
                            element: "#home",
                            intro:
                                'Click here to return to your home page'
                        },
                        {
                            element: "#account",
                            intro:
                                'Click here to view your account details and edit them'
                        },
                        {
                            element: "#add",
                            intro:
                                'Click here to add new notes'
                        },
                        {
                            element: "#logout",
                            intro:
                                'Click here to logout of your account'
                        },
                        {
                            element: '#deleteAccount',
                            intro:
                                'Click here to delete your account. NOTE: This action is not reversible. It will delete all notes that you have created alongside your account'
                        },
                        {
                            element: "#expandIcon",
                            intro:
                                'Click on the arrows on the left hand side to expand the subsection of your notes. To select a note, simply click on its name. To delete it, click the cross icon next to it'
                        },

                    ]
            });
            this.introJS.oncomplete(() => {
                localStorage.setItem('buttonExplanationCompleted', 'true');
            });
            this.introJS.onexit(() => {
                localStorage.setItem('buttonExplanationCompleted', 'true');
            });
            this.introJS.start()
        }
    } // 1

}
