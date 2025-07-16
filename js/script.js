function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

document.querySelector('form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Message sent!');
    this.reset();
});