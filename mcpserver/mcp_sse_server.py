#!/usr/bin/env python3
"""LangConnect MCP Server using FastMCP"""

import json
import os
import sys
from datetime import datetime
from getpass import getpass
from pathlib import Path
from typing import Optional

import httpx
import requests
from dotenv import load_dotenv
from langchain_core.output_parsers import BaseOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

from fastmcp import FastMCP

load_dotenv()


# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SSE_PORT = int(os.getenv("SSE_PORT", "8765"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


# Output parser for multi-query generation
class LineListOutputParser(BaseOutputParser[list[str]]):
    """Output parser for a list of lines."""

    def parse(self, text: str) -> list[str]:
        # Split into lines, strip whitespace, and remove empties
        lines = [line.strip() for line in text.strip().split("\n")]
        return [line for line in lines if line]


# Create FastMCP server
mcp = FastMCP(name="LangConnect")


# Authentication functions
def sign_in(email: str, password: str):
    """Sign in to Supabase and get access token."""
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/signin",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("access_token"), data.get("refresh_token")
        error = response.json()
        print(f"Sign in failed: {error.get('detail', 'Unknown error')}")
        return None, None

    except Exception as e:
        print(f"Error during sign in: {e!s}")
        return None, None


def test_token(token: str):
    """Test if the token works by calling the collections endpoint."""
    try:
        response = requests.get(
            f"{API_BASE_URL}/collections", headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code == 200
    except:
        return False


def update_env_file(token: str):
    """Update the .env file with the new access token."""
    env_path = Path(__file__).parent.parent / ".env"

    if not env_path.exists():
        print("⚠️  .env file not found. Creating new one...")
        with open(env_path, "w") as f:
            f.write(f"SUPABASE_JWT_SECRET={token}\n")
        return

    # Read existing .env file
    with open(env_path) as f:
        lines = f.readlines()

    # Update or add SUPABASE_JWT_SECRET
    updated = False
    new_lines = []

    for line in lines:
        if line.strip().startswith("SUPABASE_JWT_SECRET="):
            new_lines.append(f"SUPABASE_JWT_SECRET={token}\n")
            updated = True
        else:
            new_lines.append(line)

    # If SUPABASE_JWT_SECRET wasn't found, add it
    if not updated:
        # Add newline if file doesn't end with one
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines[-1] += "\n"
        new_lines.append(f"SUPABASE_JWT_SECRET={token}\n")

    # Write back to .env file
    with open(env_path, "w") as f:
        f.writelines(new_lines)

    print("✅ Updated .env file with new access token")


def get_access_token():
    """Get Supabase access token through user authentication."""
    print("\n🔐 Authentication Required")
    print("=" * 40)
    print("Please sign in to generate your access token")
    print()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return None

    # Get credentials
    email = input("Enter your email: ")
    password = getpass("Enter your password: ")

    print("\nSigning in...")
    access_token, refresh_token = sign_in(email, password)

    if access_token:
        print("✅ Sign in successful!")
        print("Testing token...")

        if test_token(access_token):
            print("✅ Token is valid and working!")
            # Update .env file with new token
            update_env_file(access_token)
            return access_token
        print("❌ Token validation failed.")
        return None
    print("❌ Sign in failed. Please check your credentials.")
    return None


def ensure_valid_token():
    """Ensure we have a valid token, prompting for login if necessary."""
    global SUPABASE_JWT_SECRET

    # First check if we have a token
    if SUPABASE_JWT_SECRET:
        print("Testing existing token...")
        if test_token(SUPABASE_JWT_SECRET):
            print("✅ Existing token is valid!")
            return SUPABASE_JWT_SECRET
        else:
            print("❌ Existing token is invalid or expired.")

    # Get new token
    print("\n⚠️  No valid token found. Please authenticate.")
    new_token = get_access_token()

    if new_token:
        SUPABASE_JWT_SECRET = new_token
        # Reload the token for the current session
        os.environ["SUPABASE_JWT_SECRET"] = new_token
        return new_token

    return None


# HTTP client
class LangConnectClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def update_token(self, token: str):
        """Update the authorization token."""
        self.token = token
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
        else:
            self.headers.pop("Authorization", None)

    async def request(self, method: str, endpoint: str, **kwargs):
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}{endpoint}"
            response = await client.request(
                method, url, headers=self.headers, timeout=60.0, **kwargs
            )
            response.raise_for_status()
            return (
                response.json()
                if response.status_code != 204
                else {"status": "success"}
            )


# Initialize client (will be updated with valid token on startup)
client = LangConnectClient(API_BASE_URL, "")


@mcp.tool
async def search_documents(
    collection_id: str,
    query: str,
    limit: int = 5,
    search_type: str = "semantic",
    filter_json: Optional[str] = None,
) -> str:
    """Search documents in a collection using semantic, keyword, or hybrid search."""
    search_data = {"query": query, "limit": limit, "search_type": search_type}

    if filter_json:
        try:
            search_data["filter"] = json.loads(filter_json)
        except json.JSONDecodeError:
            return "Error: Invalid JSON in filter parameter"

    results = await client.request(
        "POST", f"/collections/{collection_id}/documents/search", json=search_data
    )

    if not results:
        return "No results found."

    output = f"## Search Results ({search_type})\n\n"
    for i, result in enumerate(results, 1):
        output += f"### Result {i} (Score: {result.get('score', 0):.4f})\n"
        output += f"{result.get('page_content', '')}\n"
        output += f"Document ID: {result.get('id', 'Unknown')}\n\n"

    return output


@mcp.tool
async def list_collections() -> str:
    """List all available document collections."""
    collections = await client.request("GET", "/collections")

    if not collections:
        return "No collections found."

    output = "## Collections\n\n"
    for coll in collections:
        output += (
            f"- **{coll.get('name', 'Unnamed')}** (ID: {coll.get('uuid', 'Unknown')})\n"
        )

    return output


@mcp.tool
async def get_collection(collection_id: str) -> str:
    """Get details of a specific collection."""
    collection = await client.request("GET", f"/collections/{collection_id}")
    return f"**{collection.get('name', 'Unnamed')}**\nID: {collection.get('uuid', 'Unknown')}"


@mcp.tool
async def create_collection(name: str, metadata_json: Optional[str] = None) -> str:
    """Create a new collection."""
    data = {"name": name}

    if metadata_json:
        try:
            data["metadata"] = json.loads(metadata_json)
        except json.JSONDecodeError:
            return "Error: Invalid JSON in metadata"

    result = await client.request("POST", "/collections", json=data)
    return f"Collection '{result.get('name')}' created with ID: {result.get('uuid')}"


@mcp.tool
async def delete_collection(collection_id: str) -> str:
    """Delete a collection and all its documents."""
    await client.request("DELETE", f"/collections/{collection_id}")
    return f"Collection {collection_id} deleted successfully!"


@mcp.tool
async def list_documents(collection_id: str, limit: int = 20) -> str:
    """List documents in a collection."""
    docs = await client.request(
        "GET", f"/collections/{collection_id}/documents", params={"limit": limit}
    )

    if not docs:
        return "No documents found."

    output = f"## Documents ({len(docs)} items)\n\n"
    for i, doc in enumerate(docs, 1):
        content_preview = doc.get("page_content", "")[:200]
        if len(doc.get("page_content", "")) > 200:
            content_preview += "..."
        output += f"{i}. {content_preview}\n   ID: {doc.get('id', 'Unknown')}\n\n"

    return output


@mcp.tool
async def list_document_groups(collection_id: str, limit: int = 20) -> str:
    """List document groups (original files) in a collection.

    This function retrieves and displays all original documents stored in a specific collection,
    grouped by their original file. Unlike list_documents() which shows individual chunks,
    this function shows each original document as a single entry with information about
    how many chunks it was split into. This is useful for understanding the structure
    of your document collection and managing documents at the file level.

    Args:
        collection_id: The unique identifier of the collection to list documents from.
                      This should be obtained from the list_collections() function or
                      provided by the user. Must be a valid UUID string for an existing collection.
        limit: Maximum number of document groups to return. Default is 20, which helps manage
               large collections by providing pagination. Higher values will return more
               document groups but may take longer to process and display.

    Returns:
        str: Formatted string containing a numbered list of document groups with file information,
             chunk counts, and metadata. Format: "## Document Groups (N items)\n\n1. [file info...]\n   Chunks: X | Source: Y | ID: Z"
             If no documents are found, returns "No documents found."
    """
    # Use the new efficient document groups API
    document_groups = await client.request(
        "GET", f"/collections/{collection_id}/document-groups", params={"limit": limit}
    )

    if not document_groups:
        return "No document groups found."

    output = f"## Document Groups ({len(document_groups)} items)\n\n"
    for i, group in enumerate(document_groups, 1):
        chunk_count = group["chunk_count"]
        source = group["source"]
        timestamp = group["created_at"]
        total_chars = group["total_chars"]
        file_id = group["file_id"]

        output += f"{i}. **{source}**\n"
        output += f"   Chunks: {chunk_count} | Characters: {total_chars:,} | File ID: {file_id}\n"
        output += f"   Added: {timestamp}\n\n"

    return output


@mcp.tool
async def add_documents(
    collection_id: str,
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    enable_chunking: bool = True,
    metadata_json: Optional[str] = None,
) -> str:
    """Add a text document to a collection.

    Args:
        collection_id: The unique identifier of the collection to add the document to.
        text: The text content of the document to add.
        chunk_size: Maximum number of characters in each chunk (default: 1000)
        chunk_overlap: Number of overlapping characters between chunks (default: 200)
        enable_chunking: Whether to split documents into chunks (default: True)
        metadata_json: Optional JSON string containing custom metadata for the document
    """
    # Base metadata
    metadata = {"source": "mcp-input", "created_at": datetime.now().isoformat()}

    # Add custom metadata if provided
    if metadata_json:
        try:
            custom_metadata = json.loads(metadata_json)
            metadata.update(custom_metadata)
        except json.JSONDecodeError:
            return "Failed to add document: Invalid metadata JSON format"

    files = [("files", ("document.txt", text.encode("utf-8"), "text/plain"))]
    data = {
        "metadatas_json": json.dumps([metadata]),
        "chunk_size": str(chunk_size),
        "chunk_overlap": str(chunk_overlap),
        "enable_chunking": str(enable_chunking),
    }

    # Remove Content-Type for multipart
    headers = client.headers.copy()
    headers.pop("Content-Type", None)

    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(
            f"{client.base_url}/collections/{collection_id}/documents",
            headers=headers,
            files=files,
            data=data,
            timeout=60.0,
        )
        response.raise_for_status()
        result = response.json()

    if result.get("success"):
        return f"Document added successfully! Created {len(result.get('added_chunk_ids', []))} chunks."
    return f"Failed to add document: {result.get('message', 'Unknown error')}"


@mcp.tool
async def upload_local_file(
    collection_id: str,
    file_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    enable_chunking: bool = True,
    metadata_json: Optional[str] = None,
) -> str:
    """Upload a local file to a collection.

    This function reads a local file and uploads it to an existing collection. The file
    will be processed according to the chunking parameters and can include custom metadata.
    Supported file types include: PDF, TXT, DOCX, MD, HTML, and more.

    Args:
        collection_id: The unique identifier of the collection to add the document to.
                      This should be obtained from the list_collections() function or
                      provided by the user. Must be a valid UUID string for an existing collection.
        file_path: The path to the local file to upload. This should be a valid file path
                  that exists on the local filesystem. The file will be read and processed.
        chunk_size: Maximum number of characters in each chunk (default: 1000)
        chunk_overlap: Number of overlapping characters between chunks (default: 200)
        enable_chunking: Whether to split documents into chunks (default: True)
        metadata_json: Optional JSON string containing custom metadata for the document

    Returns:
        str: Success message indicating the file was uploaded and the number of chunks created.
             Format: "File uploaded successfully! Created N chunks."
             If the operation fails, returns an error message with details.
    """
    import os
    from pathlib import Path

    # Check if file exists
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        return f"Error: File not found at path '{file_path}'"

    if not file_path_obj.is_file():
        return f"Error: Path '{file_path}' is not a file"

    # Read file content
    try:
        with open(file_path_obj, "rb") as f:
            file_content = f.read()
    except Exception as e:
        return f"Error reading file: {e}"

    # Determine file type and filename
    filename = file_path_obj.name
    file_extension = file_path_obj.suffix.lower()

    # Map file extensions to MIME types
    mime_type_map = {
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".html": "text/html",
        ".htm": "text/html",
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
    }

    mime_type = mime_type_map.get(file_extension, "text/plain")

    # Base metadata - source is always the filename
    metadata = {
        "source": filename,  # Always use filename as source
        "created_at": datetime.now().isoformat(),
        "file_path": str(file_path_obj.absolute()),
        "file_size": len(file_content),
    }

    # Add custom metadata if provided
    if metadata_json:
        try:
            custom_metadata = json.loads(metadata_json)
            metadata.update(custom_metadata)
        except json.JSONDecodeError:
            return "Failed to upload file: Invalid metadata JSON format"

    # Prepare file upload
    files = [("files", (filename, file_content, mime_type))]
    data = {
        "metadatas_json": json.dumps([metadata]),
        "chunk_size": str(chunk_size),
        "chunk_overlap": str(chunk_overlap),
        "enable_chunking": str(enable_chunking),
    }

    # Remove Content-Type for multipart
    headers = client.headers.copy()
    headers.pop("Content-Type", None)

    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{client.base_url}/collections/{collection_id}/documents",
                headers=headers,
                files=files,
                data=data,
                timeout=120.0,
            )
            response.raise_for_status()
            result = response.json()

        if result.get("success"):
            chunk_count = len(result.get("added_chunk_ids", []))
            return f"File '{filename}' uploaded successfully! Created {chunk_count} chunks."
        else:
            return f"Failed to upload file: {result.get('message', 'Unknown error')}"

    except Exception as e:
        return f"Error uploading file: {e}"


@mcp.tool
async def delete_document(collection_id: str, document_id: str) -> str:
    """Delete a document from a collection."""
    await client.request(
        "DELETE", f"/collections/{collection_id}/documents/{document_id}"
    )
    return f"Document {document_id} deleted successfully!"


@mcp.tool
async def multi_query(question: str) -> str:
    """Generate multiple queries (3-5) for better vector search results from a single user question."""
    if not OPENAI_API_KEY:
        return json.dumps({"error": "OpenAI API key not configured"})

    try:
        # Initialize LLM
        llm = ChatOpenAI(temperature=0, api_key=OPENAI_API_KEY)

        # Create prompt template
        query_prompt = PromptTemplate(
            input_variables=["question"],
            template="""You are an AI language model assistant. Your task is to generate 3 to 5
different versions of the given user question to retrieve relevant documents from a vector
database. By generating multiple perspectives on the user question, your goal is to help
the user overcome some of the limitations of the distance-based similarity search.
Provide these alternative questions separated by newlines. Do not number them.
Original question: {question}""",
        )

        # Create parser
        output_parser = LineListOutputParser()

        # Create chain
        chain = query_prompt | llm | output_parser

        # Generate queries
        queries = await chain.ainvoke({"question": question})

        # Return as JSON array
        return json.dumps(queries, ensure_ascii=False)

    except Exception as e:
        return json.dumps({"error": f"Failed to generate queries: {e!s}"})


@mcp.tool
async def get_health_status() -> str:
    """Check API health status."""
    result = await client.request("GET", "/health")
    return f"Status: {result.get('status', 'Unknown')}\nAPI: {API_BASE_URL}\nAuth: {'✓' if SUPABASE_JWT_SECRET else '✗'}"


if __name__ == "__main__":
    print("🚀 LangConnect MCP SSE Server")
    print("=" * 50)

    # Ensure we have a valid token before starting
    valid_token = ensure_valid_token()

    if not valid_token:
        print("\n❌ Unable to obtain valid authentication token.")
        print("Please check your credentials and try again.")
        sys.exit(1)

    # Update the client with the valid token
    client.update_token(valid_token)

    print(f"\n✅ Starting MCP SSE server on http://127.0.0.1:{SSE_PORT}")
    print(
        "This server is for MCP clients only and cannot be accessed directly in a browser."
    )
    print("\n⚠️  Note: The access token will expire in about 1 hour.")
    print("When it expires, restart the server to get a new token.")

    try:
        mcp.run(transport="sse", port=SSE_PORT)
    except KeyboardInterrupt:
        print("\n\n✅ Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)
