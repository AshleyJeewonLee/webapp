const form = document.getElementById('userForm')

let formData = {
  url: ''
}

document.getElementById('name').addEventListener('input', function (e) {
  formData.url = e.target.value
})

// Handle form submission
form.addEventListener('submit', async function (e) {
  e.preventDefault()
  try {
    // Show loading state
    const button = form.querySelector('button')
    const originalText = button.textContent
    button.textContent = 'Generating...'
    button.disabled = true

    const recommendations = await generatePicture(formData)
    renderResponse(recommendations.response)
    // Reset button state
    button.textContent = originalText
    button.disabled = false

    // Optional: Clear form
    form.reset()
    formData = { theme: '', genre: [] }

  } catch (error) {
    console.error('Error:', error)
    document.getElementById('nameError').textContent = 'An error occurred. Please try again.'
  }
})

/**
 * Renders a response into a container element
 * @param {{
*   img: string,
*   response: Record<'color'|'pattern'|'style'|'material'|'occasion'|'fit'|'details'|'season', string>
* }[]} res - Array of image and analysis response pairs
* @returns {void}
*/
function renderResponse(res){
  const container = document.getElementById('response-container');
  if (res.length) {
    const html = res.map(item => `
      <div class="analysis-card">
        <img src="${item.img}" alt="Analyzed clothing" class="image-preview">
        <div class="analysis-details">
          ${Object.entries(item.response).map(([key, values]) => `
            <div class="detail-item">
              <span class="detail-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div class="tag-list">
                ${values}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  
    container.innerHTML = html;
  } else {
    const html = `
    <div class="error-card">Error parsing...Try another website!</div>
    `
    container.innerHTML = html;
  }
}

async function generatePicture(data) {
  // Simulate API call
  console.log('Generating res with data:', data)

  // Simulate delay
  const response = await fetch("/api/picture", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)  // Convert formData to JSON string
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const recs = await response.json()
  const processedRecs = recs['data']
  
  return {
    success: true,
    response: processedRecs
  }
}

