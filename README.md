# Assignment 1: HTML & CSS

You are tasked with building the website for __Artmart__, a web shop for fine art prints.

In this first assignment, you will implement the responsive design of the Artmart website using HTML and CSS. You need to follow the [Artmart Design Guide][design_guide], which you can find on TUWEL.

You should build the website inside the `www` folder. It already contains some HTML and CSS fragments for you to use as starting points, as well as various graphical assets used throughout the site. Take a look at what's there and figure out what remains to be done.

## What you need to do

- Implement the website according to the [Artmart Design Guide][design_guide].
- Write *valid* and *accessible* HTML.
- Pass all the tests (see below).

[design_guide]: https://tuwel.tuwien.ac.at/mod/resource/view.php?id=2232710

## General Advice

- **Read these instructions and the design guide carefully**

- Try to write your HTML and CSS as simple as possible.

- It is not necessary to delete any of the existing CSS rules.

- Reuse fragments that are already provided, don't reinvent the wheel. Check the `style.css` and each page's source before you start implementing something.

- Reuse as much of your own CSS as possible. For example, you shouldn't need to write separate CSS rules for the museum labels for every page.

- We do not recommend using "CSS Reset" rules that affect every element's default style (like `* { margin: 0; }`). This will just make your life harder.

- Use the [`rgb()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb()) notation if you need to adjust the opacity of your CSS colors.

## Additional notes

- The design guide may at times be ambiguous or leave some gaps in the specification. You might have to make some judgement calls. Let the tests be your guide. If the tests are at odds with the design guide, the tests are right.

- If you find yourself getting frustrated because you can't seem to get the design *just right*, take a step back and consider the big picture. In order to solve this exercise and pass the tests, it should never be necceassy to push around individual pixels. **Keep it simple.**

- If something is not covered by the tests *but specified in the assignment* (in this case, the design guide), then we expect you to implement it. We might run additional tests on our end. Inversely, if something is not specified in the assignment *but expected by the tests*, then we also expect you to implement it.

- This assignment is about building a static website using **only HTML & CSS**. Do not use JavaScript, which will be covered in the next assignment.

- You are not required to take backwards-compatibility into account. You can code against the latest versions of Chrome, Firefox and Safari. You *will* need to ensure cross-browser and cross-platform compatibility, but within reason.

- **This is a solo exercise.** You are required to solve it on your own. We encourage you to discuss the assignment with your coursemates, to ask questions on TUWEL, and to participate in the tutor hours. However, you will ultimately need to write your own code. You are not allowed to copy someone else's solution or solutions from previous years. *We have automated systems that check for plagiarism.*

## Tests

The `test` folder contains automated tests with which you can measure your progress.

> :warning: **Do not modify anything in the `test` folder.** For the final assessment, we will entirely replace this folder with our own (which also might include additional tests). If your code only works with modifications of the test scripts (no matter how trivial!) it will not pass the final tests.

Every time you push a commit to GitHub, the tests will be run automatically on GitHub's servers. To see the results, you have to go to your repository on GitHub and click on the *Actions* tab. There you will see all past test runs. Click on the latest run and look at the *Artifacts* field to download the test report.

### Local testing

If you wish to run the tests locally on your machine, you need to have [Docker](https://www.docker.com) installed. Then you can navigate to the top-level project directory (the one this README is in) and type the following:

    docker run --tty -v "/$PWD":/usr/app/a1 ipalab/web-eng-a1 node test.js        

This will run all the tests and print out your point total. For details, see the generated report at `test/report/report.html`.

> :warning: Please note that due to differences between platforms, it is possible that the results you get locally on your machine differ from those shown on GitHub. **What counts for your grade are the points you see on GitHub.**

If you are using Windows, you may need to slightly alter the above command, depending on your shell:

- PowerShell: `docker run --tty -v ${PWD}:/usr/app/a1 ipalab/web-eng-a1 node test.js`
- cmd.exe: `docker run --tty -v "%cd%":/usr/app/a1 ipalab/web-eng-a1 node test.js`

> :warning: Unfortunately, the docker container does not run on Apple Silicon. We are very sorry about this issue, but it is outside of our control. If you have a Mac with an Apple Silicon Chip (M1, M2, M3) please use GitHub for testing.
