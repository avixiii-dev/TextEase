using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Controls.Primitives;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Navigation;
using Windows.Foundation;
using Windows.Foundation.Collections;
using System.Text.RegularExpressions;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace TextEase
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private bool _isTextChangedEnabled = true;

        public MainWindow()
        {
            this.InitializeComponent();
            InitializeEditor();
        }

        private void InitializeEditor()
        {
            // Set initial state
            MainEditor.TextWrapping = TextWrapping.Wrap;
            WordWrapButton.IsChecked = true;

            // Set initial focus
            MainEditor.Focus(FocusState.Programmatic);
        }

        private void UndoButton_Click(object sender, RoutedEventArgs e)
        {
            if (MainEditor.CanUndo)
            {
                MainEditor.Undo();
            }
        }

        private void RedoButton_Click(object sender, RoutedEventArgs e)
        {
            if (MainEditor.CanRedo)
            {
                MainEditor.Redo();
            }
        }

        private void WordWrapButton_Click(object sender, RoutedEventArgs e)
        {
            MainEditor.TextWrapping = WordWrapButton.IsChecked ?? false 
                ? TextWrapping.Wrap 
                : TextWrapping.NoWrap;
        }

        private void MainEditor_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (!_isTextChangedEnabled) return;

            UpdateWordCount();
            UpdateUndoRedoButtons();
        }

        private void MainEditor_SelectionChanged(object sender, RoutedEventArgs e)
        {
            UpdateSelectionStats();
        }

        private void UpdateWordCount()
        {
            var text = MainEditor.Text ?? string.Empty;
            var wordCount = Regex.Matches(text, @"\b\w+\b").Count;
            WordCount.Text = $"Words: {wordCount}";
        }

        private void UpdateSelectionStats()
        {
            var text = MainEditor.Text ?? string.Empty;
            var selectionStart = MainEditor.SelectionStart;
            
            // Calculate line and column
            var textBeforeCursor = text.Substring(0, selectionStart);
            var lines = textBeforeCursor.Split('\n');
            var currentLine = lines.Length;
            var currentColumn = lines[lines.Length - 1].Length + 1;

            SelectionStats.Text = $"Ln {currentLine}, Col {currentColumn}";
        }

        private void UpdateUndoRedoButtons()
        {
            UndoButton.IsEnabled = MainEditor.CanUndo;
            RedoButton.IsEnabled = MainEditor.CanRedo;
        }
    }
}
