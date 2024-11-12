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
    console.log(recommendations)
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

function renderResponse(res){
  const container = document.getElementById('response-container')
  container.innerHTML = res 
}

async function generatePicture(data) {
  // Simulate API call
  console.log('Generating res with data:', data)

  // Simulate delay
  const response = await fetch("http://localhost:8000/api/picture", {
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

