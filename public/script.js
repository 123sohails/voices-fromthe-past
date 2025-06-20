const mainContent = document.getElementById('mainContent');
const browseBtn = document.getElementById('browseBtn');
const submitBtn = document.getElementById('submitBtn');
const browseLettersBtn = document.getElementById('browseLettersBtn');

browseBtn.addEventListener('click', showEntryList);
submitBtn.addEventListener('click', showSubmitForm);
browseLettersBtn.addEventListener('click', showLettersList);

document.addEventListener('DOMContentLoaded', showEntryList);

function showEntryList() {
  mainContent.innerHTML = '<h2>Browse Entries</h2><ul class="entry-list" id="entryList"></ul>';
  fetch('/api/entries')
    .then(res => res.json())
    .then(entries => {
      const list = document.getElementById('entryList');
      if (entries.length === 0) {
        list.innerHTML = '<li>No entries yet.</li>';
        return;
      }
      entries.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="entry-title">${entry.title}</div>
          <div class="entry-meta">${entry.type} | ${entry.author} | ${entry.date}</div>
          <div>${entry.content.slice(0, 120)}${entry.content.length > 120 ? '...' : ''}</div>
          <div class="entry-actions">
            <button class="like-btn" aria-label="Like">👍 Like</button>
            <button class="share-btn" aria-label="Share">🔗 Share</button>
            <button class="comment-btn" aria-label="Comment">💬 Comment</button>
          </div>
        `;
        li.onclick = () => showEntryDetail(entry.id);
        list.appendChild(li);
      });
    });
}

function showEntryDetail(id) {
  fetch(`/api/entries/${id}`)
    .then(res => res.json())
    .then(entry => {
      // Create a cleaner version of the content for audio
      const audioContent = entry.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      
      mainContent.innerHTML = `
        <button onclick="showEntryList()">&larr; Back</button>
        <h2>${entry.title}</h2>
        <div class="entry-meta">${entry.type} | ${entry.author} | ${entry.date}</div>
        <div style="white-space: pre-line; margin-bottom: 16px;">${entry.content}</div>
        <button class="audio-btn" onclick="playAudio('${audioContent}')">🔊 Listen</button>
      `;
    });
}

function playAudio(encodedText) {
  try {
    // First decode the URL-encoded text
    const text = decodeURIComponent(encodedText);
    
    // Clean up common encoding issues
    const cleanText = text
      .replace(/[""]/g, '"')  // Replace smart quotes with regular quotes
      .replace(/['']/g, "'")  // Replace smart apostrophes with regular ones
      .replace(/—/g, '-')     // Replace em dashes with regular dashes
      .replace(/…/g, '...')   // Replace ellipsis with regular dots
      .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
      .trim();                // Remove leading/trailing spaces
    
    console.log('Original encoded text:', encodedText);
    console.log('Decoded text:', text);
    console.log('Clean text:', cleanText);
    
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.lang = 'en-US';
      
      // Add event listeners for better user feedback
      utter.onstart = () => {
        console.log('Audio started playing');
        // Change button text to show it's playing
        const button = event.target;
        button.textContent = '🔊 Playing...';
        button.disabled = true;
      };
      
      utter.onend = () => {
        console.log('Audio finished playing');
        // Reset button text
        const button = event.target;
        button.textContent = '🔊 Listen';
        button.disabled = false;
      };
      
      utter.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        alert('Sorry, there was an error playing the audio. Please try again.');
        // Reset button text on error
        const button = event.target;
        button.textContent = '🔊 Listen';
        button.disabled = false;
      };
      
      window.speechSynthesis.speak(utter);
    } else {
      alert('Sorry, your browser does not support speech synthesis.');
    }
  } catch (error) {
    console.error('Error in playAudio function:', error);
    alert('Sorry, there was an error processing the audio. Please try again.');
  }
}

function showSubmitForm() {
  mainContent.innerHTML = `
    <h2>Submit a New Entry</h2>
    <form id="entryForm" class="form-section">
      <label>Title <input name="title" required></label>
      <label>Author <input name="author" required></label>
      <label>Date <input name="date" type="date" required></label>
      <label>Type
        <select name="type" required>
          <option value="Diary">Diary</option>
          <option value="Journal">Journal</option>
          <option value="Letter">Letter</option>
        </select>
      </label>
      <label>Tags (comma separated) <input name="tags"></label>
      <label>Content <textarea name="content" rows="8" required></textarea></label>
      <button type="submit">Submit</button>
    </form>
  `;
  document.getElementById('entryForm').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      author: form.author.value,
      date: form.date.value,
      type: form.type.value,
      tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean),
      content: form.content.value
    };
    fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(entry => {
        alert('Entry submitted!');
        showEntryList();
      })
      .catch(() => alert('Error submitting entry.'));
  };
}

function showLettersList() {
  mainContent.innerHTML = '<h2>Browse Letters</h2><ul class="entry-list" id="letterList"></ul>';
  fetch('/api/entries')
    .then(res => res.json())
    .then(entries => {
      const letters = entries.filter(entry => entry.type === 'Letter');
      const list = document.getElementById('letterList');
      if (letters.length === 0) {
        list.innerHTML = '<li>No letters found.</li>';
        return;
      }
      letters.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="entry-title">${entry.title}</div>
          <div class="entry-meta">${entry.author} | ${entry.date}</div>
          <div>${entry.content.slice(0, 120)}${entry.content.length > 120 ? '...' : ''}</div>
          <div class="entry-actions">
            <button class="like-btn" aria-label="Like">👍 Like</button>
            <button class="share-btn" aria-label="Share">🔗 Share</button>
            <button class="comment-btn" aria-label="Comment">💬 Comment</button>
          </div>
        `;
        li.onclick = () => showEntryDetail(entry.id);
        list.appendChild(li);
      });
    });
} 