// In webview.js

// There are many ways to listen to click events, you can even use
// something like jQuery or React. This is how it can be done using
// plain JavaScript:
document.addEventListener('click', event => {
	const element = event.target;
	// If a TOC header has been clicked:
	if (element.className === 'toc-item-link') {

		// Post the message and slug info back to the plugin:
		webviewApi.postMessage({
			name: 'scrollToHash',
			hash: element.dataset.slug,
		});
	}
});

document.addEventListener('contextmenu', event => {
    const element = event.target;
    if (element.className === 'toc-item-link') {
        webviewApi.postMessage({
            name: 'contextMenu',
            hash: element.dataset.slug,
            content: element.innerText
        });

        // document.getElementsByClassName('header')[0].innerHTML = 'Link copied to clipboard';
        // setTimeout('document.getElementsByClassName("header")[0].innerHTML = "TOC"', 800)
    }
});
