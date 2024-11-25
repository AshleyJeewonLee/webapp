import { promptGPT } from "./shared/openai.ts"
// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"

// Import the createExitSignal function from the JS+OAI shared library
import { createExitSignal, staticServer } from "./shared/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const app = new Application()
const router = new Router()
function cleanGPTResponse(response) {
    return response.replace(/```json|```/g, '').trim();
}
async function parseKeywords(url) {    
    try {
        const response = await fetch(url)
        const html = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = doc.querySelectorAll('img')
        // Convert NodeList to Array and get src attributes
        const imageUrls = Array.from(images).map(img => img.getAttribute('src')).filter(link => link.includes('http'));
        
        const desc = []
        if (imageUrls.length) {
            try {
                await Promise.all(
                    imageUrls.map(async (img) => {
                        try {
                            const completion = await promptGPT(img, `You are a helpful assistant that analyzes clothing images. Return a JSON object with the following structure:
                            {
                                'color': description of colors present,
                                'pattern': description of any prints or patterns,
                                'style': description of style categories like casual, formal, etc,
                                'material': description of visible fabric types,
                                'occasion': description of suitable occasions,
                                'fit': fit description,
                                'season': description of suitable seasons to wear the clothing,
                                'details': description of special features or embellishments
                            }`)
                            const cleanedResponse = cleanGPTResponse(completion);
                            const parsed = JSON.parse(cleanedResponse);
                            if (completion && !completion.toLowerCase().includes("error")) {  
                                desc.push({img, response: parsed});
                            }
                        } catch (error) {
                            console.error(`Error processing image ${img}:`, error);
                        }
                    })
                );
            } catch (error) {
                console.error('Error in Promise.all:', error);
            }
        }
        
        return desc;
    } catch (e) {
        console.error(`Failed to process image ${url}: ${e.message}`);
        return []
    }
}



// Create an instance of the Application and Router classes

// app.use(async (ctx, next) => {
//     ctx.response.headers.set('Access-Control-Allow-Origin', '*')
//     ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
//     ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type")

//     // Handle preflight requests
//     if (ctx.request.method === "OPTIONS") {
//         ctx.response.status = 200
//         return
//     }

//     await next()
// })

router.post("/api/picture", async (ctx) => {
    console.log("Requested picture generate")
    try {
        // Get the request body
        const body = ctx.request.body()

        if (body.type === "json") {
            const value = await body.value
            console.log("Received data:", value)

            // Process the data here
            const res = await parseKeywords(value['url'])

            ctx.response.body = {
                success: true,
                message: "Response generated successfully",
                data: res
            }
        } else {
            ctx.response.status = 400
            ctx.response.body = {
                success: false,
                message: "Request must be JSON"
            }
        }
    } catch (error) {
        console.error("Error processing request:", error)
        ctx.response.status = 500
        ctx.response.body = {
            success: false,
            message: "Internal server error"
        }
    }
})

// Tell the app to use the router
app.use(router.routes())
app.use(router.allowedMethods())
app.use(staticServer)

// Everything is set up, let's start the server
await app.listen({ port: 8000, signal: createExitSignal() })
