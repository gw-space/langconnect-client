import logging
import uuid

from fastapi import UploadFile
from langchain_community.document_loaders.parsers import (
    BS4HTMLParser,
    PDFPlumberParser,
)
from langchain_community.document_loaders.parsers.generic import MimeTypeBasedParser
from langchain_community.document_loaders.parsers.msword import MsWordParser
from langchain_community.document_loaders.parsers.txt import TextParser
from langchain_core.documents.base import Blob, Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

LOGGER = logging.getLogger(__name__)

# Document Parser Configuration
HANDLERS = {
    "application/pdf": PDFPlumberParser(),
    "text/plain": TextParser(),
    "text/html": BS4HTMLParser(),
    "text/markdown": TextParser(),  # Markdown files
    "text/x-markdown": TextParser(),  # Alternative markdown MIME type
    "application/msword": MsWordParser(),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
        MsWordParser()
    ),
}

SUPPORTED_MIMETYPES = sorted(HANDLERS.keys())

MIMETYPE_BASED_PARSER = MimeTypeBasedParser(
    handlers=HANDLERS,
    fallback_parser=None,
)


async def process_document(
    file: UploadFile,
    metadata: dict | None = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    enable_chunking: bool = True,
) -> list[Document]:
    """Process an uploaded file into LangChain documents."""
    # Generate a unique ID for this file processing instance
    file_id = uuid.uuid4()

    contents = await file.read()

    # Determine the actual mime type
    mime_type = file.content_type or "text/plain"

    # Handle application/octet-stream by checking file extension
    if mime_type == "application/octet-stream" and file.filename:
        filename_lower = file.filename.lower()
        if filename_lower.endswith(".md") or filename_lower.endswith(".markdown"):
            mime_type = "text/markdown"
        elif filename_lower.endswith(".txt"):
            mime_type = "text/plain"
        elif filename_lower.endswith(".html") or filename_lower.endswith(".htm"):
            mime_type = "text/html"
        elif filename_lower.endswith(".pdf"):
            mime_type = "application/pdf"
        elif filename_lower.endswith(".doc"):
            mime_type = "application/msword"
        elif filename_lower.endswith(".docx"):
            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    blob = Blob(data=contents, mimetype=mime_type)

    docs = MIMETYPE_BASED_PARSER.parse(blob)

    # Get the content from the first document
    content = docs[0].page_content

    # Set base metadata
    base_metadata = metadata or {}
    base_metadata["file_id"] = str(file_id)
    base_metadata["enable_chunking"] = enable_chunking

    # Process based on chunking preference
    if enable_chunking:
        # Apply chunking
        return process_with_chunking(content, base_metadata, chunk_size, chunk_overlap)
    else:
        # No chunking, store as one chunk
        return process_without_chunking(content, base_metadata)


def process_without_chunking(content: str, metadata: dict) -> list[Document]:
    """Process documents without chunking - store as one chunk."""
    doc = Document(
        page_content=content, metadata={**metadata, "chunk_type": "single_chunk"}
    )
    return [doc]


def process_with_chunking(
    content: str, metadata: dict, chunk_size: int, chunk_overlap: int
) -> list[Document]:
    """Process documents with chunking."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )

    temp_doc = Document(page_content=content, metadata=metadata)
    split_docs = text_splitter.split_documents([temp_doc])

    # Add chunking metadata
    for doc in split_docs:
        doc.metadata["chunk_type"] = "chunked"

    return split_docs
