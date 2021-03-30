// Import the Joplin API
import joplin from 'api';

import { ToolbarButtonLocation } from 'api/types';

// Register the plugin
joplin.plugins.register({

	onStart: async function() {
		// Create the panel object
		const panel = await joplin.views.panels.create('toc-panel');
		//const panel = joplin.views.createWebviewPanel();

		 // Add the CSS file to the view, right after it has been created:
		await joplin.views.panels.setHtml(panel, 'TOC');
		await joplin.views.panels.addScript(panel, './webview.css');
		await joplin.views.panels.addScript(panel, './webview.js'); // Add the JS file
		
		// Set some initial content while the TOC is being created
		await joplin.views.panels.setHtml(panel, 'Loading...');

		async function updateTocView() {
			const note = await joplin.workspace.selectedNote();
			slugs = {}; // Reset the slugs

			if (note) {
				const headers = noteHeaders(note.body);

				// First create the HTML for each header:
				const itemHtml = [];
				for (const header of headers) {
					const slug = headerSlug(header.text);

					// - We indent each header based on header.level.
					//
					// - The slug will be needed later on once we implement clicking on a header.
					//   We assign it to a "data" attribute, which can then be easily retrieved from JavaScript
					//
					// - Also make sure you escape the text before inserting it in the HTML to avoid XSS attacks
					//   and rendering issues. For this use the `escapeHtml()` function you've added earlier.
					itemHtml.push(`
						<p class="toc-item" style="padding-left:${(header.level - 1) * 15}px">
							<a class="toc-item-link" href="#" data-slug="${escapeHtml(slug)}">
								${escapeHtml(header.text)}
							</a>
						</p>
					`);
				}

				// Finally, insert all the headers in a container and set the webview HTML:
				await joplin.views.panels.setHtml(panel, `
					<div class="container" id='header'>
						Table of Contents
						${itemHtml.join('\n')}
					</div>
				`);
			} else {
				await joplin.views.panels.setHtml(panel, 'Please select a note to view the table of content');
			}
		}

		await joplin.views.panels.onMessage(panel, async (message: any) => {
			if (message.name === 'scrollToHash') {
				// As the name says, the scrollToHash command makes the note scroll
				// to the provided hash.
				joplin.commands.execute('scrollToHash', message.hash)
			} else if (message.name === 'contextMenu') {
				console.debug(message.hash)
				
				const noteId = (await joplin.workspace.selectedNoteIds())[0]
				//const noteTitle = (await joplin.data.get(['notes', noteId], { fields: ['title'] } )).title

				const innerLink = `[#${message.content}](:/${noteId}#${message.hash})`
				copyToClipboard(innerLink)
			}
		});

		// This event will be triggered when the user selects a different note
		await joplin.workspace.onNoteSelectionChange(() => {
			updateTocView();
		});

		// This event will be triggered when the content of the note changes
		// as you also want to update the TOC in this case.
		await joplin.workspace.onNoteContentChange(() => {
			updateTocView();
		});

		// Also update the TOC when the plugin starts
		updateTocView();

		await joplin.commands.register({
            name: 'toggleTOC',
            label: 'Toggle TOC',
            iconName: 'fas fa-bars',
            execute: async () => {
                const isVisible = await (joplin.views.panels as any).visible(panel);
                (joplin.views.panels as any).show(panel, !isVisible);
            },
        });
        await joplin.views.toolbarButtons.create('toggleTOC', 'toggleTOC', ToolbarButtonLocation.NoteToolbar);
	},

});

function noteHeaders(noteBody:string) {
	const headers = [];
	const lines = noteBody.split('\n');
	for (const line of lines) {
		const match = line.match(/^(#+)\s(.*)*/);
		if (!match) continue;
		headers.push({
			level: match[1].length,
			text: match[2],
		});
	}
	return headers;
}

const uslug = require('uslug');

let slugs = {};

const copyToClipboard = str => {
	  const el = document.createElement('textarea');
	  el.value = str;
	  el.setAttribute('readonly', '');
	  el.style.position = 'absolute';
	  el.style.left = '-9999px';
	  document.body.appendChild(el);
	  el.select();
	  document.execCommand('copy');
	  document.body.removeChild(el);
};

function headerSlug(headerText) {
	const s = uslug(headerText);
	let num = slugs[s] ? slugs[s] : 1;
	const output = [s];
	if (num > 1) output.push(num);
	slugs[s] = num + 1;
	return output.join('-');
}


// From https://stackoverflow.com/a/6234804/561309
function escapeHtml(unsafe:string) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

