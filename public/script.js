const mainContent = document.getElementById('mainContent');
const browseBtn = document.getElementById('browseBtn');
const submitBtn = document.getElementById('submitBtn');
const browseLettersBtn = document.getElementById('browseLettersBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');

browseBtn.addEventListener('click', showEntryList);
submitBtn.addEventListener('click', showSubmitForm);
browseLettersBtn.addEventListener('click', showLettersList);

// Search functionality
searchBtn.addEventListener('click', performSearch);
clearSearchBtn.addEventListener('click', clearSearch);
searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Global variable to store all entries for search
let allEntries = [];
let currentPage = 1;
const entriesPerPage = 5;

document.addEventListener('DOMContentLoaded', showEntryList);

function showEntryList() {
  mainContent.innerHTML = '<h2>Browse Entries</h2><ul class="entry-list" id="entryList"></ul><div id="pagination"></div>';
  fetch('/api/entries')
    .then(res => res.json())
    .then(entries => {
      // Store all entries globally for search functionality
      allEntries = entries;
      
      const list = document.getElementById('entryList');
      if (entries.length === 0) {
        list.innerHTML = '<li>No entries yet.</li>';
        return;
      }
      
      // Calculate pagination
      const totalPages = Math.ceil(entries.length / entriesPerPage);
      const startIndex = (currentPage - 1) * entriesPerPage;
      const endIndex = startIndex + entriesPerPage;
      const pageEntries = entries.slice(startIndex, endIndex);
      
      // Display entries for current page
      pageEntries.forEach(entry => {
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
      
      // Add pagination controls
      if (totalPages > 1) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = createPaginationControls(currentPage, totalPages, entries.length, startIndex + 1, endIndex);
      }
      
      // Update search button visibility
      clearSearchBtn.style.display = 'none';
    });
}

function showEntryDetail(id) {
  fetch(`/api/entries/${id}`)
    .then(res => res.json())
    .then(entry => {
      mainContent.innerHTML = `
        <button onclick="showEntryList()">&larr; Back</button>
        <h2>${entry.title}</h2>
        <div class="entry-meta">${entry.type} | ${entry.author} | ${entry.date}</div>
        <div style="white-space: pre-line; margin-bottom: 16px;">${entry.content}</div>
        <button class="audio-btn" data-content="${entry.content.replace(/"/g, '&quot;')}">🔊 Listen</button>
      `;
      
      // Add event listener to the audio button
      const audioBtn = mainContent.querySelector('.audio-btn');
      audioBtn.addEventListener('click', function() {
        const content = this.getAttribute('data-content');
        playAudio(content);
      });
    });
}

function playAudio(content) {
  try {
    // Check if audio is already playing
    if (window.speechSynthesis.speaking) {
      // Stop the current audio
      window.speechSynthesis.cancel();
      const button = event.target;
      button.textContent = '🔊 Listen';
      button.disabled = false;
      return;
    }
    
    // Clean up common encoding issues
    const cleanText = content
      .replace(/[""]/g, '"')  // Replace smart quotes with regular quotes
      .replace(/['']/g, "'")  // Replace smart apostrophes with regular ones
      .replace(/—/g, '-')     // Replace em dashes with regular dashes
      .replace(/…/g, '...')   // Replace ellipsis with regular dots
      .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
      .trim();                // Remove leading/trailing spaces
    
    console.log('Original content:', content);
    console.log('Clean text:', cleanText);
    
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.lang = 'en-US';
      
      // Get the button that was clicked
      const button = event.target;
      
      // Add event listeners for better user feedback
      utter.onstart = () => {
        console.log('Audio started playing');
        button.textContent = '⏹️ Stop';
        button.disabled = false;
      };
      
      utter.onend = () => {
        console.log('Audio finished playing');
        button.textContent = '🔊 Listen';
        button.disabled = false;
      };
      
      utter.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        alert('Sorry, there was an error playing the audio. Please try again.');
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

function performSearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm === '') {
    currentPage = 1; // Reset to first page
    showEntryList();
    return;
  }

  const filteredEntries = allEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm) ||
    entry.author.toLowerCase().includes(searchTerm) ||
    entry.content.toLowerCase().includes(searchTerm) ||
    (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );

  // Show clear search button
  clearSearchBtn.style.display = 'inline-block';

  if (filteredEntries.length === 0) {
    mainContent.innerHTML = `
      <h2>Search Results</h2>
      <div class="no-results">
        <p>No entries found matching "${searchTerm}"</p>
        <p>Try searching for different keywords or browse all entries.</p>
      </div>
    `;
    return;
  }

  mainContent.innerHTML = `
    <h2>Search Results (${filteredEntries.length} found)</h2>
    <div class="search-results">Searching for: "${searchTerm}"</div>
    <ul class="entry-list" id="searchResults"></ul>
  `;
  
  const resultsList = document.getElementById('searchResults');
  filteredEntries.forEach(entry => {
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
    resultsList.appendChild(li);
  });
}

function clearSearch() {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  showEntryList();
}

function createPaginationControls(currentPage, totalPages, totalEntries, startEntry, endEntry) {
  let controls = '<div class="pagination-container">';
  
  // Previous button
  if (currentPage > 1) {
    controls += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">← Previous</button>`;
  }
  
  // Page numbers
  controls += '<div class="page-numbers">';
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      controls += `<button class="pagination-btn active">${i}</button>`;
    } else {
      controls += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
    }
  }
  controls += '</div>';
  
  // Next button
  if (currentPage < totalPages) {
    controls += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">Next →</button>`;
  }
  
  controls += '</div>';
  controls += `<div class="pagination-info">Showing entries ${startEntry}-${Math.min(endEntry, totalEntries)} of ${totalEntries} total</div>`;
  
  return controls;
}

function changePage(page) {
  currentPage = page;
  showEntryList();
} 