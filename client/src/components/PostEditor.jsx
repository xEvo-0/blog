import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getImageUrl } from "../api/posts.js";

const categories = ["Design", "Culture", "Travel", "Technology", "Life", "Notes"];

export default function PostEditor({ initialPost, onSubmit, busy, error }) {
  const [imagePreview, setImagePreview] = useState(initialPost?.coverImage ? getImageUrl(initialPost.coverImage) : "");
  const [formError, setFormError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function chooseImage(event) {
    const file = event.target.files?.[0];
    setFormError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Images must be 5 MB or smaller.");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  }

  function submit(event) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const image = inputRef.current?.files?.[0];
    if (image) formData.set("coverImage", image);
    else formData.delete("coverImage");
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    if (title.length < 3) {
      setFormError("Give your story a title of at least 3 characters.");
      return;
    }
    if (!content) {
      setFormError("Your story needs a little content before it can be published.");
      return;
    }
    onSubmit(formData);
  }

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-main">
        <label className="field-label" htmlFor="post-title">STORY TITLE</label>
        <input id="post-title" className="title-input" name="title" defaultValue={initialPost?.title} placeholder="Give your story a title..." maxLength="120" required />
        <label className="field-label content-label" htmlFor="post-content">YOUR STORY</label>
        <textarea id="post-content" className="content-input" name="content" defaultValue={initialPost?.content} placeholder="Once upon a time..." required />
      </div>
      <aside className="editor-sidebar">
        <label className="field-label">COVER IMAGE</label>
        <input ref={inputRef} className="visually-hidden" type="file" name="coverImage" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} />
        {imagePreview ? (
          <div className="image-preview">
            <img src={imagePreview} alt="Selected cover" />
            <button type="button" className="image-remove" aria-label="Remove cover image" onClick={() => {
              setImagePreview("");
              if (inputRef.current) inputRef.current.value = "";
            }}><X size={15} /></button>
            <button type="button" className="change-image" onClick={() => inputRef.current?.click()}>Change image</button>
          </div>
        ) : (
          <button type="button" className="upload-area" onClick={() => inputRef.current?.click()}>
            <span className="upload-icon"><ImagePlus size={19} /></span>
            <strong>Add a cover image</strong>
            <span>JPG, PNG, WEBP or GIF · up to 5 MB</span>
          </button>
        )}

        <label className="field-label sidebar-label" htmlFor="post-excerpt">SHORT DESCRIPTION</label>
        <textarea id="post-excerpt" className="side-textarea" name="excerpt" defaultValue={initialPost?.excerpt} placeholder="A short preview of your story..." maxLength="240" rows="3" />

        <label className="field-label sidebar-label" htmlFor="post-category">CATEGORY</label>
        <select id="post-category" name="category" className="select-input" defaultValue={initialPost?.category || "Design"}>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>

        <label className="field-label sidebar-label" htmlFor="post-tags">TAGS</label>
        <input id="post-tags" name="tags" className="side-input" defaultValue={initialPost?.tags?.join(", ")} placeholder="creativity, ideas, ..." />

        <div className="editor-actions">
          <p>Your story will be published immediately.</p>
          <button type="submit" className="button button-dark publish-button" disabled={busy}>
            {busy ? <><LoaderCircle className="spin" size={16} /> Saving...</> : initialPost ? "Save changes" : "Publish story"}
          </button>
        </div>
        {(formError || error) && <p className="form-error" role="alert">{formError || error}</p>}
      </aside>
    </form>
  );
}
