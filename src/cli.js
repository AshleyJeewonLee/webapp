import { promptGPT } from "./shared/openai.ts"
// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"

// Import the createExitSignal function from the JS+OAI shared library
import { createExitSignal, staticServer } from "./shared/server.ts"
const app = new Application()
const router = new Router()

async function parseKeywords(img) {    
 
    try {
        const completion = await promptGPT([{content: [
        {
            type: "image_url",
            image_url: {
            url: img,
            }
        }
        ]}], "You are helpful assistant that analyzes the keywords associated with provided image of clothing. Return bullet points of its key features")
        
        const response = JSON.parse(completion)
        return response
    } catch (e) {
        console.error(`Failed to process image ${img}: ${e.message}`);
        return "No error shown"
    }
}



// Create an instance of the Application and Router classes

app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    // Handle preflight requests
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200
        return
    }

    await next()
})

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
console.log("\nListening on http://localhost:8000")
await app.listen({ port: 8000, signal: createExitSignal() })
